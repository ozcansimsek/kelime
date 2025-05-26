const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const kelimeler = require("./kelimeler.json");
const { getRandomTurkishLetter } = require("./utils/getRandomTurkishLetter");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const rooms = {}; // { roomName: { players: [], gameStatus: {} } }
const games = {}; // { roomName: { currentPlayerId, usedWords, timer, scores, currentLetter } }

function getNextPlayer(players, currentId) {
  if (players.length === 1) return players[0]; // ✅ Tek kişi varsa hep aynı kişi
  const index = players.findIndex((p) => p.id === currentId);
  return players[(index + 1) % players.length];
}

function startTurnTimer(room, playerId) {
  const game = games[room];
  if (!game) return;

  if (game.timer) clearInterval(game.timer);

  let timeLeft = 20;

  game.timer = setInterval(() => {
    if (!rooms[room]) {
      clearInterval(game.timer);
      delete games[room];
      return;
    }

    io.to(room).emit("timerUpdate", { playerId, timeLeft });

    if (timeLeft <= 0) {
      clearInterval(game.timer);
      io.to(room).emit("timeUp", playerId);

      // Eğer tek oyuncu varsa ve süresi bittiğinde kelime giremediyse, oyun bitsin
      if (rooms[room].length === 1) {
        const player = rooms[room][0];
        io.to(room).emit("gameOver", {
          winner: player.username,
          scores: game.scores,
        });

        delete games[room];
        return;
      }

      // Çok oyunculuysa: süre dolan oyuncu oyundan atılır
      rooms[room] = rooms[room].filter((p) => p.id !== playerId);
      delete game.scores[playerId];

      // Eğer sadece 1 kişi kaldıysa, onu kazanan olarak bildir
      if (rooms[room].length === 1) {
        const winner = rooms[room][0];
        io.to(room).emit("gameOver", {
          winner: winner.username,
          scores: game.scores,
        });

        delete games[room];
        return;
      }

      // Sonraki oyuncuya geç
      const nextPlayer = getNextPlayer(rooms[room], playerId);
      game.currentPlayerId = nextPlayer.id;

      io.to(room).emit("playerList", rooms[room]);
      io.to(room).emit("turnChanged", nextPlayer.id);
      startTurnTimer(room, nextPlayer.id);
    }

    timeLeft--;
  }, 1000);
}

function startRound(room) {
  const letter = getRandomTurkishLetter();
  if (!games[room]) return;

  games[room].currentLetter = letter; // ✅ Set it in the game object

  io.to(room).emit("roundStarted", { letter });
}

io.on("connection", (socket) => {
  console.log(`Yeni bağlantı: ${socket.id}`);

  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    socket.data.username = username;
    socket.data.room = room;
  });

  socket.on("requestRoomInfo", () => {
    socket.emit("roomInfo", {
      username: socket.data.username,
      room: socket.data.room,
    });
  });

  socket.on("joinRoom", ({ username, room }) => {
    if (!rooms[room]) rooms[room] = [];

    rooms[room].push({ id: socket.id, username });
    socket.join(room);
    socket.emit("joinSuccess", { room, username });
    io.to(room).emit("playerList", rooms[room]);

    console.log(`${username} odaya katıldı: ${room}`);
  });

  socket.on("startGame", (room) => {
    if (!rooms[room] || rooms[room].length < 1) return;

    const firstPlayer = rooms[room][0];

    games[room] = {
      currentPlayerId: firstPlayer.id,
      usedWords: [],
      timer: null,
      scores: {},
      currentLetter: "",
    };

    rooms[room].forEach((p) => {
      games[room].scores[p.id] = 0;
    });

    io.to(room).emit("gameStarted", firstPlayer.id);
    console.log("gameStarted emitted: ", room);

    startRound(room);
    startTurnTimer(room, firstPlayer.id);
  });

  socket.on("sendWord", ({ room, word }) => {
    const game = games[room];
    if (!game || socket.id !== game.currentPlayerId) return;

    const normalizedWord = word.trim().toLocaleLowerCase("tr-TR");

    if (
      !normalizedWord.startsWith(game.currentLetter.toLocaleLowerCase("tr-TR"))
    ) {
      socket.emit(
        "wordRejected",
        `❌ Kelime "${game.currentLetter.toUpperCase()}" harfiyle başlamalı!`
      );
      return;
    }

    if (game.usedWords.includes(normalizedWord)) {
      socket.emit("wordRejected", "❌ Bu kelime daha önce girildi!");
      return;
    }

    if (!kelimeler.includes(normalizedWord)) {
      socket.emit("wordRejected", "❌ Bu kelime sözlükte bulunamadı!");
      return;
    }

    socket.emit("wordRejected", ""); // ✅ Hata mesajını temizle

    game.usedWords.push(normalizedWord);

    // Puanlama: kelime uzunluğu kadar puan ekle
    game.scores[socket.id] =
      (game.scores[socket.id] || 0) + normalizedWord.length;

    // Güncel puanları da gönder
    io.to(room).emit("newWord", {
      word: normalizedWord,
      by: socket.id,
      scores: game.scores,
    });

    startRound(room); // ✅ Yeni harf ver

    const nextPlayer = getNextPlayer(rooms[room], socket.id);
    game.currentPlayerId = nextPlayer.id;

    io.to(room).emit("turnChanged", nextPlayer.id);
    startTurnTimer(room, nextPlayer.id); // ✅ Timer başlat
  });

  socket.on("disconnect", () => {
    console.log(`Bağlantı koptu: ${socket.id}`);

    for (const room in rooms) {
      const index = rooms[room].findIndex((p) => p.id === socket.id);

      if (index !== -1) {
        const username = rooms[room][index].username;

        // Oyuncuyu odadan çıkar
        rooms[room].splice(index, 1);

        // Puan listesinden çıkar
        if (games[room]?.scores) {
          delete games[room].scores[socket.id];
        }

        // Eğer oyun başlamışsa ve sırası bu oyuncudaysa
        if (games[room]?.currentPlayerId === socket.id) {
          clearInterval(games[room].timer); // Mevcut tur zamanlayıcısını temizle

          // Eğer başka oyuncular kaldıysa, bir sonrakine geç
          if (rooms[room].length > 0) {
            const nextPlayer = getNextPlayer(rooms[room], socket.id);
            games[room].currentPlayerId = nextPlayer.id;

            io.to(room).emit("turnChanged", nextPlayer.id);
            startTurnTimer(room, nextPlayer.id);
          }
        }

        // Eğer son kişi çıktıysa, odayı tamamen temizle
        if (rooms[room].length === 0) {
          delete rooms[room];
          delete games[room];
          console.log(`Oda silindi: ${room}`);
        } else {
          // Diğer oyunculara güncellenmiş listeyi gönder
          io.to(room).emit("playerList", rooms[room]);
        }

        // Oyuncu ayrıldığını bildir
        io.to(room).emit("playerLeft", { id: socket.id, username });
        break;
      }
    }
  });
});

server.listen(3000, () => {
  console.log("Sunucu çalışıyor http://localhost:3000");
});
