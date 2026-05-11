function log(event, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...data,
  };
  console.log(JSON.stringify(entry));
}

module.exports = {
  auth: (event, data) => log(`AUTH_${event}`, data),
  security: (event, data) => log(`SECURITY_${event}`, data),
  usage: (event, data) => log(`USAGE_${event}`, data),
  error: (event, data) => log(`ERROR_${event}`, data),
};