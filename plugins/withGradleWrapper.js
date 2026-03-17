const { withDangerousMod, withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withGradleWrapper(expoConfig) {

  // Fix 1: Gradle wrapper → 8.10.2
  expoConfig = withDangerousMod(expoConfig, [
    'android',
    function(modConfig) {
      const wrapperPath = path.join(
        modConfig.modRequest.platformProjectRoot,
        'gradle', 'wrapper', 'gradle-wrapper.properties'
      );
      fs.writeFileSync(wrapperPath, [
        'distributionBase=GRADLE_USER_HOME',
        'distributionPath=wrapper/dists',
        'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip',
        'zipStoreBase=GRADLE_USER_HOME',
        'zipStorePath=wrapper/dists',
        '',
      ].join('\n'), 'utf8');
      return modConfig;
    },
  ]);

  // Fix 2: hermesCommand + resolutionStrategy — single withAppBuildGradle call
  expoConfig = withAppBuildGradle(expoConfig, function(modConfig) {
    var contents = modConfig.modResults.contents;

    // 2a: Fix hermesCommand for RN 0.79
    if (contents.includes('hermes-compiler')) {
      contents = contents.replace(
        /hermesCommand\s*=\s*new File\(\["node",\s*"--print",\s*"require\.resolve\('hermes-compiler\/package\.json'[^"]*"\]\.execute\(null,\s*rootDir\)\.text\.trim\(\)\)\.getParentFile\(\)\.getAbsolutePath\(\)\s*\+\s*"\/hermesc\/%OS-BIN%\/hermesc"/,
        "hermesCommand = new File([\"node\", \"--print\", \"require.resolve('react-native/package.json')\"].execute(null, rootDir).text.trim()).getParentFile().getAbsolutePath() + \"/sdks/hermesc/%OS-BIN%/hermesc\""
      );
    }

    // 2b: Force androidx.core to version compatible with AGP 8.8.2
    if (!contents.includes("force 'androidx.core:core:")) {
      contents = contents + '\nconfigurations.all {\n    resolutionStrategy {\n        force \'androidx.core:core:1.15.0\'\n        force \'androidx.core:core-ktx:1.15.0\'\n    }\n}\n';
    }

    modConfig.modResults.contents = contents;
    return modConfig;
  });

  // Fix 3: compileSdk/targetSdk/buildTools → 36
  expoConfig = withGradleProperties(expoConfig, function(modConfig) {
    var props = modConfig.modResults;
    function setProp(key, value) {
      var idx = props.findIndex(function(p) { return p.type === 'property' && p.key === key; });
      if (idx >= 0) { props[idx].value = value; }
      else { props.push({ type: 'property', key: key, value: value }); }
    }
    setProp('android.compileSdkVersion', '36');
    setProp('android.targetSdkVersion', '36');
    setProp('android.buildToolsVersion', '36.0.0');
    setProp('android.suppressUnsupportedCompileSdk', '36');
    return modConfig;
  });

  return expoConfig;
};