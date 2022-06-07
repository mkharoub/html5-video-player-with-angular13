import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit, AfterViewInit {
  @ViewChild('videoContainer') videoContainer: ElementRef<HTMLElement>;
  @ViewChild('video') video: ElementRef<HTMLVideoElement>;
  @ViewChild('controlsActions') controlsActions: ElementRef;
  @ViewChild('progress') progress: ElementRef<HTMLProgressElement>;

  public supportsHtml5Video: boolean;
  public fullScreenEnabled: boolean;
  public progressMax = 0;
  public progressBarWidth = '0%';
  public isFullScreenActive = false;
  public isVideoPlaying = false;

  constructor() {
  }

  ngOnInit(): void {
    const video = document.createElement('video');

    this.supportsHtml5Video = !!video.canPlayType;
    this.fullScreenEnabled = !!(
      document.fullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled ||
      (document as any).webkitSupportsFullscreen ||
      (document as any).webkitFullscreenEnabled ||
      (video as any).webkitRequestFullScreen
    );
  }

  ngAfterViewInit() {
    if (this.supportsHtml5Video) {
      const video = this.video.nativeElement;

      video.controls = false;
      video.onloadedmetadata = () => {
        this.progressMax = video.duration;
      }
      video.ontimeupdate = () => {
        this.progress.nativeElement.value = video.currentTime;
        this.progressBarWidth = Math.floor((video.currentTime / video.duration) * 100) + '%';
      }
    }
  }

  @HostListener('click', ['$event'])
  onVideoPlayerClick(event: Event) {
    if (!this.controlsActions.nativeElement.contains(event.target)) {
      this.onPlayPauseClick();
    }
  }

  @HostListener('document:fullscreenchange')
  onFullScreenChange() {
    this.setFullScreenData(!!((document as any).fullScreen || document.fullscreenElement));
  }

  @HostListener('document:webkitfullscreenchange')
  webkitFullScreenChange() {
    this.setFullScreenData(!!(document as any).webkitIsFullScreen);
  }

  @HostListener('document:mozfullscreenchange')
  mozFullScreenChange() {
    this.setFullScreenData(!!(document as any).mozFullScreen);
  }

  @HostListener('document:msfullscreenchange')
  msFullScreenChange() {
    this.setFullScreenData(!!(document as any).msFullscreenElement);
  }

  private setFullScreenData(state: boolean) {
    this.isFullScreenActive = state;
  }

  private static isFullScreen(): boolean {
    return !!(
      (document as any).fullScreen ||
      (document as any).webkitIsFullScreen ||
      (document as any).mozFullScreen ||
      (document as any).msFullscreenElement ||
      document.fullscreenElement
    );
  }

  private playVideo() {
    this.video.nativeElement.play();
    this.isVideoPlaying = true;
  }

  private pauseVideo() {
    this.video.nativeElement.pause();
    this.isVideoPlaying = false;
  }

  onPlayPauseClick() {
    const video = this.video.nativeElement;

    if (video.paused || video.ended) {
      this.playVideo();

      return;
    }

    this.pauseVideo();
  }

  onStopClick() {
    const video = this.video.nativeElement;

    video.pause();
    video.currentTime = 0;

    this.progress.nativeElement.value = 0;
  }

  onMuteClick() {
    const video = this.video.nativeElement;

    video.muted = !video.muted;
  }

  onAlertVolume(dir: string) {
    const video = this.video.nativeElement;
    const currentVolume = Math.floor(video.volume * 10) / 10;

    if (dir === '+') {
      if (currentVolume < 1) video.volume += 0.1;
    } else if (dir === '-') {
      if (currentVolume > 0) video.volume -= 0.1;
    }
  }

  onFullScreenClick() {
    const isFullScreen = VideoPlayerComponent.isFullScreen();

    if (isFullScreen) {
      this.setFullScreenData(false);

      if (document.exitFullscreen) {
        document.exitFullscreen();

        return;
      }

      if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
        return;
      }

      if ((document as any).webkitCancelFullScreen) {
        (document as any).webkitCancelFullScreen();
        return;
      }

      if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }

      return;
    }

    this.setFullScreenData(true);

    if (this.videoContainer.nativeElement.requestFullscreen) {
      this.videoContainer.nativeElement.requestFullscreen();
      return;
    }

    if ((this.videoContainer.nativeElement as any).mozRequestFullScreen) {
      (this.videoContainer.nativeElement as any).mozRequestFullScreen();
      return;
    }

    if ((this.videoContainer.nativeElement as any).webkitRequestFullScreen) {
      (this.video.nativeElement as any).webkitRequestFullScreen();
      return;
    }

    if ((this.videoContainer.nativeElement as any).msRequestFullscreen) {
      (this.videoContainer.nativeElement as any).msRequestFullscreen();
      return;
    }
  }

  onProgressClick(e: MouseEvent) {
    const video = this.video.nativeElement;
    const progress = this.progress.nativeElement;
    const pos = (e.pageX  - this.videoContainer.nativeElement.offsetLeft - progress.offsetLeft) / progress.offsetWidth;

    video.currentTime = pos * video.duration;
  }
}
