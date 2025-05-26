export function getOrCreateUserId() {
  let userId = localStorage.getItem('user-id')
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem('user-id', userId)
  }
  return userId
}
