const { withAppBuildGradle } = require('@expo/config-plugins')

module.exports = function withStandaloneDebug(config) {
  return withAppBuildGradle(config, config => {
    const marker = 'debuggableVariants = []'
    if (!config.modResults.contents.includes(marker)) {
      config.modResults.contents = config.modResults.contents.replace('react {', `react {\n    ${marker}`)
    }
    return config
  })
}
