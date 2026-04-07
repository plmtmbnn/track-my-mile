import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Platform, Alert, PermissionsAndroid } from 'react-native';

export class FileService {
  private static async requestStoragePermission() {
    if (Platform.OS !== 'android') return true;
    
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to your storage to save GPX files.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  }

  static async saveWorkoutToGPX(gpxContent: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `workout_${timestamp}.gpx`;
    
    // Use public Downloads folder on Android for easy user access
    let baseDir = Platform.OS === 'android' ? RNFS.DownloadDirectoryPath : RNFS.DocumentDirectoryPath;
    
    // Fallback if DownloadDirectoryPath is unavailable
    if (!baseDir) baseDir = RNFS.ExternalDirectoryPath;
    
    const path = `${baseDir}/${fileName}`;

    try {
      await RNFS.writeFile(path, gpxContent, 'utf8');
      console.log('File written to:', path);
      Alert.alert('Success', `Workout saved to Downloads folder:\n${fileName}`);
      return path;
    } catch (e) {
      console.error('Error writing file:', e);
      Alert.alert('Save Failed', 'Could not save the GPX file to storage.');
      throw e;
    }
  }

  static async shareWorkoutFile(filePath: string) {
    // Ensure path has file:// prefix for the share sheet to recognize it
    const sharePath = filePath.startsWith('file://') ? filePath : `file://${filePath}`;

    const options = {
      url: sharePath,
      type: 'application/gpx+xml',
      title: 'Share your workout GPX',
      failOnCancel: false,
    };

    try {
      await Share.open(options);
    } catch (e) {
      if (e && (e as any).message !== 'User did not share') {
        console.error('Error sharing file:', e);
        Alert.alert('Share Error', 'Could not open the share menu. Check if the file exists.');
      }
    }
  }
}
