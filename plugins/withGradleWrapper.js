const {
  withDangerousMod,
  withAppBuildGradle,
  withGradleProperties,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withGradleWrapper(expoConfig) {
  // Fix 1b: Patch ReactStylesDiffMapBackingFieldAccessor for RN 0.79
  expoConfig = withDangerousMod(expoConfig, [
    'android',
    (modConfig) => {
      var filePath = require('path').join(
        modConfig.modRequest.projectRoot,
        'node_modules/expo-modules-core/android/src/main/java/com/facebook/react/uimanager/ReactStylesDiffMapBackingFieldAccessor.java'
      );
      var newContent = [
        'package com.facebook.react.uimanager;',
        '',
        'import java.lang.reflect.Field;',
        'import java.util.HashMap;',
        'import java.util.Map;',
        '',
        'public class ReactStylesDiffMapBackingFieldAccessor {',
        '  public static Map<String, Object> getBackingMap(ReactStylesDiffMap diffMap) {',
        '    try {',
        '      Field field = ReactStylesDiffMap.class.getDeclaredField("mBackingMap");',
        '      field.setAccessible(true);',
        '      return (Map<String, Object>) field.get(diffMap);',
        '    } catch (Exception e) {',
        '      return new HashMap<>();',
        '    }',
        '  }',
        '}',
        '',
      ].join('\n');
      require('fs').writeFileSync(filePath, newContent, 'utf8');
      return modConfig;
    },
  ]);

  // Fix 2: hermesCommand + resolutionStrategy — single withAppBuildGradle call
  expoConfig = withAppBuildGradle(expoConfig, (modConfig) => {
    var contents = modConfig.modResults.contents;

    // 2a: Fix hermesCommand for RN 0.79
    if (contents.includes('hermes-compiler')) {
      contents = contents.replace(
        /hermesCommand\s*=\s*new File\(\["node",\s*"--print",\s*"require\.resolve\('hermes-compiler\/package\.json'[^"]*"\]\.execute\(null,\s*rootDir\)\.text\.trim\(\)\)\.getParentFile\(\)\.getAbsolutePath\(\)\s*\+\s*"\/hermesc\/%OS-BIN%\/hermesc"/,
        'hermesCommand = new File(["node", "--print", "require.resolve(\'react-native/package.json\')"].execute(null, rootDir).text.trim()).getParentFile().getAbsolutePath() + "/sdks/hermesc/%OS-BIN%/hermesc"'
      );
    }

    // 2b: Force androidx.core to version compatible with AGP 8.8.2
    if (!contents.includes("force 'androidx.core:core:")) {
      contents =
        contents +
        "\nconfigurations.all {\n    resolutionStrategy {\n        force 'androidx.core:core:1.15.0'\n        force 'androidx.core:core-ktx:1.15.0'\n    }\n}\n";
    }

    modConfig.modResults.contents = contents;
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
