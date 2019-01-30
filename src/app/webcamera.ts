import * as tf from '@tensorflow/tfjs';
import { Tensor4D, Rank, Tensor, Tensor3D } from '@tensorflow/tfjs';

/**
 * A class that wraps webcam video elements to capture Tensor4Ds.
 */
export class WebCamera {

  constructor(private webcamElement: HTMLVideoElement) {}

  public capture(): Tensor {
    return tf.tidy(() => {
      const croppedImage = this.cropImage(tf.fromPixels(this.webcamElement));
      const batchedImage = croppedImage.expandDims(0);

      return batchedImage.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
    });
  }

  public cropImage(img: Tensor3D): Tensor<Rank.R3> {
    const size = Math.min(img.shape[0], img.shape[1]);
    const centerHeight = img.shape[0] / 2;
    const beginHeight = centerHeight - size / 2;
    const centerWidth = img.shape[1] / 2;
    const beginWidth = centerWidth - size / 2;
    return img.slice([beginHeight, beginWidth, 0], [size, size, 3]);
  }

  public adjustVideoSize(width: number, height: number): void {
    const aspectRatio = width / height;
    if (width >= height) {
      this.webcamElement.width = aspectRatio * this.webcamElement.height;
    } else if (width < height) {
      this.webcamElement.height = this.webcamElement.width / aspectRatio;
    }
  }

  public async setup(): Promise<void> {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia = navigator.getUserMedia;
      if (!navigator.getUserMedia) {
        reject();
      }
      
      navigator.getUserMedia(
        { video: true },
        stream => {
          this.webcamElement.srcObject = stream;
          this.webcamElement.addEventListener(
            "loadeddata",
            async () => {
              this.adjustVideoSize(
                this.webcamElement.videoWidth,
                this.webcamElement.videoHeight
              );
              resolve();
            },
            false
          );
        },
        reject,
      );
        
    });
  }
}