const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withGradleWrapper(config) {
  // Fix 1: Gradle wrapper → 8.10.2
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const wrapperPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle', 'wrapper', 'gradle-wrapper.properties'
      );
      const content = [
        'distributionBase=GRADLE_USER_HOME',
        'distributionPath=wrapper/dists',
        'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip',
        'zipStoreBase=GRADLE_USER_HOME',
        'zipStorePath=wrapper/dists',
        '',
      ].join('\n');
      fs.writeFileSync(wrapperPath, content, 'utf8');
      console.log('✅ Gradle wrapper pinned to 8.10.2');
      return config;
    },
  ]);

  // Fix 2: hermesCommand → RN 0.79 uses sdks/hermesc (no hermes-compiler package)
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const appBuildGradlePath = path.join(
        config.modRequest.platformProjectRoot,
        'app', 'build.gradle'
      );
      let content = fs.readFileSync(appBuildGradlePath, 'utf8');
      if (content.includes('hermes-compiler')) {
        content = content.replace(
          /hermesCommand = new File\(\["node", "--print", "require\.resolve\('hermes-compiler\/package\.json'[^"]*"\]\.execute\(null, rootDir\)\.text\.trim\(\)\)\.getParentFile\(\)\.getAbsolutePath\(\) \+ "\/hermesc\/%OS-BIN%\/hermesc"/,
          `hermesCommand = new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim()).getParentFile().getAbsolutePath() + "/sdks/hermesc/%OS-BIN%/hermesc"`
        );
        fs.writeFileSync(appBuildGradlePath, content, 'utf8');
        console.log('✅ hermesCommand fixed for RN 0.79');
      } else {
        console.log('ℹ️  hermesCommand already correct');
      }
      return config;
    },
  ]);

  return config;
};