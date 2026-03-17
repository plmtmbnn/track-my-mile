const {
  withDangerousMod,
  withProjectBuildGradle,
  withGradleProperties,
  withAppBuildGradle,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withGradleWrapper(expoConfig) {
  // Fix 1: Gradle wrapper → 8.10.2
  expoConfig = withDangerousMod(expoConfig, [
    'android',
    (modConfig) => {
      const wrapperPath = path.join(
        modConfig.modRequest.platformProjectRoot,
        'gradle',
        'wrapper',
        'gradle-wrapper.properties'
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
      return modConfig;
    },
  ]);

  // Fix 2: hermesCommand → RN 0.79 uses sdks/hermesc
  expoConfig = withAppBuildGradle(expoConfig, (modConfig) => {
    var contents = modConfig.modResults.contents;
    if (contents.includes('hermes-compiler')) {
      modConfig.modResults.contents = contents.replace(
        /hermesCommand = new File\(\["node", "--print", "require\.resolve\('hermes-compiler\/package\.json'[^"]*"\]\.execute\(null, rootDir\)\.text\.trim\(\)\)\.getParentFile\(\)\.getAbsolutePath\(\) \+ "\/hermesc\/%OS-BIN%\/hermesc"/,
        'hermesCommand = new File(["node", "--print", "require.resolve(\'react-native/package.json\')"].execute(null, rootDir).text.trim()).getParentFile().getAbsolutePath() + "/sdks/hermesc/%OS-BIN%/hermesc"'
      );
    }
    return modConfig;
  });

  // Fix 3: compileSdk/targetSdk/buildTools → 36
  expoConfig = withGradleProperties(expoConfig, (modConfig) => {
    var props = modConfig.modResults;

    function setProp(key, value) {
      var idx = props.findIndex((p) => p.type === 'property' && p.key === key);
      if (idx >= 0) {
        props[idx].value = value;
      } else {
        props.push({ type: 'property', key: key, value: value });
      }
    }

    setProp('android.compileSdkVersion', '36');
    setProp('android.targetSdkVersion', '36');
    setProp('android.buildToolsVersion', '36.0.0');
    setProp('android.suppressUnsupportedCompileSdk', '36');

    return modConfig;
  });

  return expoConfig;
};
