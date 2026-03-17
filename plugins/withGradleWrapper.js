const {
  withDangerousMod,
  withProjectBuildGradle,
  withGradleProperties,
  withAppBuildGradle,
} = require('@expo/config-plugins');
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

  // Fix 2: hermesCommand → RN 0.79 uses sdks/hermesc
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('hermes-compiler')) {
      config.modResults.contents = config.modResults.contents.replace(
        /hermesCommand = new File\(\["node", "--print", "require\.resolve\('hermes-compiler\/package\.json'[^"]*"\]\.execute\(null, rootDir\)\.text\.trim\(\)\)\.getParentFile\(\)\.getAbsolutePath\(\) \+ "\/hermesc\/%OS-BIN%\/hermesc"/,
        `hermesCommand = new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim()).getParentFile().getAbsolutePath() + "/sdks/hermesc/%OS-BIN%/hermesc"`
      );
      console.log('✅ hermesCommand fixed for RN 0.79');
    }
    return config;
  });

  // Fix 3: AGP → 8.9.1 (using withProjectBuildGradle - the correct API)
  config = withProjectBuildGradle(config, (config) => {
    const original = config.modResults.contents;
    config.modResults.contents = original.replace(
      /com\.android\.tools\.build:gradle:[0-9.]+/g,
      'com.android.tools.build:gradle:8.9.1'
    );
    if (config.modResults.contents !== original) {
      console.log('✅ AGP upgraded to 8.9.1');
    } else {
      console.log('⚠️  AGP classpath not found, contents preview:');
      console.log(original.substring(0, 300));
    }
    return config;
  });

  // Fix 4: compileSdk/targetSdk/buildTools → 36
  config = withGradleProperties(config, (config) => {
    const props = config.modResults;

    const set = (key, value) => {
      const idx = props.findIndex(p => p.type === 'property' && p.key === key);
      if (idx >= 0) {
        props[idx].value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    };

    set('android.compileSdkVersion', '36');
    set('android.targetSdkVersion', '36');
    set('android.buildToolsVersion', '36.0.0');
    set('android.suppressUnsupportedCompileSdk', '36');

    console.log('✅ compileSdk/targetSdk/buildTools → 36');
    return config;
  });

  return config;
};