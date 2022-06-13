import {AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoContainer') videoContainer: ElementRef;
  @ViewChild('video') video: ElementRef<HTMLVideoElement>;
  @ViewChild('controlsActions') controlsActions: ElementRef;
  @ViewChild('controlsProgress') controlsProgress: ElementRef;
  @ViewChild('volumeSlider') volumeSlider: ElementRef;

  public supportsHtml5Video: boolean;
  public fullScreenEnabled: boolean;
  public videoDuration: string;
  public videoCurrentTime: string;
  public progressBarWidth = '0%';
  public isFullScreenActive = false;
  public isVideoPlaying = false;
  public isVideoPlayerTooSmall = false;
  public isVideoTouched = false;
  public isVideoPaused = false;
  public volumeTrackProgress = 100;
  public volumeProgressHandlePosition = 43;
  public lastVolumeValue = 1;
  public hideVideoDuration = false;

  private resizeObserver: ResizeObserver;
  private videoPlayerTimeId: any;
  private handleOnVolumeSliderMouseMove: OmitThisParameter<(e: MouseEvent) => void>;
  private handleOnVolumeSliderMouseUp: OmitThisParameter<() => void>;

  constructor(private host: ElementRef, private zone: NgZone) {
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

    this.resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      this.zone.run(() => {
        if (this.video.nativeElement.offsetHeight <= 315) {
          this.isVideoPlayerTooSmall = true;

          return;
        }

        this.isVideoPlayerTooSmall = false;
      })
    });

    this.handleOnVolumeSliderMouseMove = this.onVolumeSliderMouseMove.bind(this);
    this.handleOnVolumeSliderMouseUp = this.onVolumeSliderMouseUp.bind(this);
  }

  ngAfterViewInit() {
    if (this.supportsHtml5Video) {
      const video = this.video.nativeElement;

      video.controls = false;
      video.onloadedmetadata = () => {
        this.videoDuration = VideoPlayerComponent.prettyTime(video.duration);
      }
      video.ontimeupdate = () => {
        this.progressBarWidth = Math.floor((video.currentTime / video.duration) * 100) + '%';
        this.videoCurrentTime = VideoPlayerComponent.prettyTime(video.currentTime);
      }

      this.resizeObserver.observe(this.host.nativeElement);
    }
  }

  ngOnDestroy() {
    this.resizeObserver.unobserve(this.host.nativeElement);

    clearInterval(this.videoPlayerTimeId);
  }

  @HostListener('click', ['$event'])
  onVideoPlayerClick(event: Event) {
    const isItControlsActions = this.controlsActions.nativeElement.contains(event.target);
    const isItControlsProgress = this.controlsProgress.nativeElement.contains(event.target);

    if (!isItControlsActions && !isItControlsProgress) {
      this.onPlayPauseClick();
    }
  }

  @HostListener('mouseenter')
  onVideoPlayerMouseEnter() {
    if (this.isVideoTouched) {
      return;
    }

    this.hideVideoDuration = true;

    const video = this.video.nativeElement;

    video.muted = true;
    video.play().then(() => {
      this.videoPlayerTimeId = setInterval(() => {
        video.currentTime += 15;

        if (video.currentTime >= video.duration) {
          video.currentTime = 0;
        }
      }, 1000);
    });
  }

  @HostListener('mouseout')
  onVideoPlayerMouseOut() {
    if (this.isVideoTouched) {
      return;
    }

    this.hideVideoDuration = false;
    this.prepareVideoPlayerBeforePlay();
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
    this.isVideoTouched = true;

    if (this.isVideoPaused) {
      this.isVideoPaused = false;
    }
  }

  private pauseVideo() {
    this.video.nativeElement.pause();
    this.isVideoPlaying = false;
    this.isVideoPaused = true;
  }

  private prepareVideoPlayerBeforePlay() {
    const video = this.video.nativeElement;

    video.muted = false;
    video.pause();
    video.currentTime = 0;

    clearInterval(this.videoPlayerTimeId);
  }

  private static getElementPercentage(e: MouseEvent, elm: ElementRef) {
    const rect = elm.nativeElement.getBoundingClientRect();

    return (e.pageX - rect.left) / rect.width * 100;
  };

  private static getVolumeProgressHandlePosition(percent: number) {
    let position = percent * 0.55;

    if (position > 43) {
      position = 43;
    }

    if (position < 0) {
      position = 0;
    }

    return position;
  }

  private volumeSet(percent: number) {
    this.volumeProgressHandlePosition = VideoPlayerComponent.getVolumeProgressHandlePosition(percent);
    this.volumeTrackProgress = percent;
    this.lastVolumeValue = this.video.nativeElement.volume = percent / 100;
  }

  private onVolumeSliderMouseMove(e: MouseEvent) {
    let percent = VideoPlayerComponent.getElementPercentage(e, this.volumeSlider);

    if (percent < 0) {
      percent = 0;
    } else if (percent > 100) {
      percent = 100;
    }

    this.volumeSet(percent);
  }

  private onVolumeSliderMouseUp() {
    document.removeEventListener('mousemove', this.handleOnVolumeSliderMouseMove, false);
    document.removeEventListener('mouseup', this.handleOnVolumeSliderMouseUp, false);
  }

  private static prettyTime(time: number) {
    let minutes: number | string = Math.floor(time / 60);
    let seconds: number | string = Math.floor(time % 60);

    if (minutes < 10) {
      minutes = '0' + minutes
    }

    if (seconds < 10) {
      seconds = '0' + seconds
    }

    return `${minutes}:${seconds}`;
  }

  onPlayPauseClick() {
    if (!this.isVideoTouched) {
      this.prepareVideoPlayerBeforePlay();
    }

    const video = this.video.nativeElement;

    if (video.paused || video.ended) {
      this.playVideo();

      return;
    }

    this.pauseVideo();
  }

  onVolumeSliderClick(e: MouseEvent) {
    const percent = VideoPlayerComponent.getElementPercentage(e, this.volumeSlider);

    this.volumeSet(percent);
  }

  onVolumeSliderMouseDown(e: MouseEvent) {
    e.preventDefault();

    document.addEventListener('mousemove', this.handleOnVolumeSliderMouseMove, false);
    document.addEventListener('mouseup', this.handleOnVolumeSliderMouseUp, false);
  }

  onMuteUnMuteVolume() {
    const volume = this.video.nativeElement.volume > 0 ? 0 : this.lastVolumeValue || 1;

    this.volumeProgressHandlePosition = VideoPlayerComponent.getVolumeProgressHandlePosition(volume * 100);
    this.video.nativeElement.volume = volume;
    this.volumeTrackProgress = volume * 100;
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
    const controlsProgress = this.controlsProgress.nativeElement;
    const pos = (e.pageX - this.videoContainer.nativeElement.offsetLeft - controlsProgress.offsetLeft) / controlsProgress.offsetWidth;

    video.currentTime = pos * video.duration;
  }
}
