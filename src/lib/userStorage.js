export function getUserStorageId(user) {
  if (user?.id) {
    return `account:${user.id}`
  }

  if (user?.email) {
    return `email:${user.email.toLowerCase()}`
  }

  return "guest"
}

export function getUserStorageKey(user, namespace, suffix) {
  const baseKey = `damalab:user:${getUserStorageId(user)}:${namespace}`

  return suffix ? `${baseKey}:${suffix}` : baseKey
}
