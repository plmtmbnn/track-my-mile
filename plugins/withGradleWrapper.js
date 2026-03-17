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

  // Fix 2: Force androidx.core 1.15.0 di app/build.gradle
  expoConfig = withAppBuildGradle(expoConfig, (modConfig) => {
    var contents = modConfig.modResults.contents;
    if (!contents.includes("force 'androidx.core:core:")) {
      // Tambahkan di akhir file sebelum closing brace terakhir
      contents =
        contents +
        "\nconfigurations.all {\n    resolutionStrategy {\n        force 'androidx.core:core:1.15.0'\n        force 'androidx.core:core-ktx:1.15.0'\n    }\n}\n";
      modConfig.modResults.contents = contents;
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
