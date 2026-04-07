import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Platform } from 'react-native';
import { WorkoutPoint, generateGPX } from '../utils/GPXGenerator';
import { formatFilenameTimestamp } from '../utils/WorkoutUtils';

export class WorkoutService {
  /**
   * Saves GPX content to a local file.
   */
  static async saveGPX(points: WorkoutPoint[]): Promise<string> {
    const gpxContent = generateGPX(points);
    const timestamp = formatFilenameTimestamp(new Date());
    const fileName = `workout_${timestamp}.gpx`;
    
    // Use DocumentDirectory on iOS, ExternalDirectory on Android for better visibility
    const baseDir = Platform.OS === 'android' ? RNFS.ExternalDirectoryPath : RNFS.DocumentDirectoryPath;
    const filePath = `${baseDir}/${fileName}`;

    console.log('Generating GPX File at:', filePath);
    console.log('GPX Content Preview:', gpxContent.substring(0, 200));

    try {
      await RNFS.writeFile(filePath, gpxContent, 'utf8');
      return filePath;
    } catch (error) {
      console.error('Failed to write GPX file:', error);
      throw error;
    }
  }

  /**
   * Triggers native share dialog for the GPX file.
   */
  static async shareGPX(filePath: string) {
    const shareOptions = {
      title: 'Share Workout',
      url: `file://${filePath}`,
      type: 'application/gpx+xml',
      failOnCancel: false,
    };

    try {
      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error sharing GPX file:', error);
    }
  }
}
