module.exports = {
  apps: [{
    name: "electron-app",
    script: "./server.mjs",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      HOST: "0.0.0.0"
    }
  }]
}