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
      console.log('✅ Gradle wrapper pinned to 8.10.2');
      return config;
    },
  ]);

  // Fix 2: hermesCommand → RN 0.79 uses sdks/hermesc
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const appBuildGradlePath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'build.gradle'
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

  // Fix 3: AGP 8.8.2 → 8.9.1
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const rootBuildGradlePath = path.join(config.modRequest.platformProjectRoot, 'build.gradle');
      let content = fs.readFileSync(rootBuildGradlePath, 'utf8');
      if (content.includes('com.android.tools.build:gradle:8.8.2')) {
        content = content.replace(
          'com.android.tools.build:gradle:8.8.2',
          'com.android.tools.build:gradle:8.9.1'
        );
        fs.writeFileSync(rootBuildGradlePath, content, 'utf8');
        console.log('✅ AGP upgraded to 8.9.1');
      } else {
        console.log('ℹ️  AGP already 8.9.1+');
      }
      return config;
    },
  ]);

  // Fix 4: compileSdk + targetSdk + buildTools → 36
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const gradlePropsPath = path.join(config.modRequest.platformProjectRoot, 'gradle.properties');
      let content = fs.readFileSync(gradlePropsPath, 'utf8');

      const overrides = {
        'android.compileSdkVersion': '36',
        'android.targetSdkVersion': '36',
        'android.buildToolsVersion': '36.0.0',
        'android.suppressUnsupportedCompileSdk': '36',
      };

      for (const [key, value] of Object.entries(overrides)) {
        if (content.includes(`${key}=`)) {
          content = content.replace(new RegExp(`${key}=.*`), `${key}=${value}`);
        } else {
          content += `\n${key}=${value}`;
        }
      }

      fs.writeFileSync(gradlePropsPath, content, 'utf8');
      console.log('✅ compileSdk/targetSdk/buildTools → 36');
      return config;
    },
  ]);

  return config;
};
