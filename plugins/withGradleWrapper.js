// Fix 3: Force androidx.core ke versi yang kompatibel dengan AGP 8.8.2
config = withProjectBuildGradle(config, (config) => {
  if (!config.modResults.contents.includes("force 'androidx.core:core")) {
    config.modResults.contents = config.modResults.contents.replace(
      /allprojects \{/,
      `allprojects {
    configurations.all {
        resolutionStrategy {
            force 'androidx.core:core:1.15.0'
            force 'androidx.core:core-ktx:1.15.0'
        }
    }`
    );
    console.log('✅ androidx.core forced to 1.15.0');
  }
  return config;
});
