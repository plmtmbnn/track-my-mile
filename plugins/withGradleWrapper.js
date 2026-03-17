// Fix 3: AGP → 8.9.1 (flexible regex)
config = withDangerousMod(config, [
  'android',
  (config) => {
    const rootBuildGradlePath = path.join(config.modRequest.platformProjectRoot, 'build.gradle');
    const content = fs.readFileSync(rootBuildGradlePath, 'utf8');
    console.log(
      'Current AGP line:',
      content.match(/com\.android\.tools\.build:gradle:[^\s"']*/)?.[0]
    );

    // Replace any AGP version below 8.9.1
    const updated = content.replace(
      /com\.android\.tools\.build:gradle:[0-9.]+/g,
      'com.android.tools.build:gradle:8.9.1'
    );

    if (updated !== content) {
      fs.writeFileSync(rootBuildGradlePath, updated, 'utf8');
      console.log('✅ AGP upgraded to 8.9.1');
    } else {
      console.log('⚠️  AGP pattern not found in build.gradle, dumping file:');
      console.log(content.substring(0, 500));
    }
    return config;
  },
]);
