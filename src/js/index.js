//数据接口：
var dataUrl = '/data/data.json';
// 作用域
var $scope = $(document.body);
// loading 浮层
// 这个浮层是因为在手机上查看的话文件夹在比较慢，所以先展示浮层提醒用户正在加载
// 样式和代码分别在index.html/index.css中有定义
var $loadingLayer = $('.loading-layer');

/********** AudioManager ********/
var AudioManager = function (dataList) {
    // 数据列表
    this.dataList = dataList;
    // 数据索引
    this.index = 0;
    // 数据长度
    this.len = dataList.length;
    // audio对象
    this.audio = new Audio();
    this.audio.preload = 'auto';
    // 当前音频的长度
    this.duration = dataList[0].duration;
    this.setAudio();
    this.bindAudioEvent();
    // 用来表示是否播放
    this.autoPlay = false;
};

AudioManager.prototype = {
    // 播放下一首
    playNext: function () {
        this.index++;
        if (this.index === this.len) {
            this.index = 0;
        }
        this.setAudio();
    },
    // 播放上一首
    playPrev: function () {
        this.index--;

        if (this.index === -1) {
            this.index = this.len - 1;
        }
        this.setAudio();
    },
    // 播放指定一首
    playIndex: function (index) {
        this.index = index;
        this.autoPlay = true;

        this.setAudio();
    },
    // 获得当前的播放歌曲信息
    getCurInfo: function () {
        return this.dataList[this.index];
    },
    // audio 对象的各种事件
    bindAudioEvent: function () {
        var _self = this;

        $(this.audio).on('ended', function () {
            _self.playNext();
        }).on('canplaythrough', function () {
            $loadingLayer.hide();
        });
    },
    // 设置 Audio
    setAudio: function () {
        var data = this.dataList[this.index];

        this.duration = data.duration;
        this.audio.src = data.audio;
        this.audio.load();

        if (this.autoPlay) {
            this.play();
        }

        $scope.trigger('changeAudio');
    },
    // 设置当前歌曲的总时长
    getDurationTime: function () {
        return this.duration;
    },
    // 设置当前播放时间
    // 如果传了ratio，则根据比例取时间，否则按照当前播放时间
    getCurTime: function (ratio) {
        var curTime;

        if (ratio) {
            curTime = ratio * this.duration;
        } else {
            curTime = this.audio.currentTime;
        }

        return Math.round(curTime);
    },
    // 跳转播放
    jumpToPlay: function (ratio) {
        var time = ratio * this.duration;

        this.autoPlay = true;

        this.audio.currentTime = time;
        // 避免在暂停状态县拖拽导致不播放
        this.audio.play();
    },
    // 获取当前播放的比例
    getPlayRation: function () {
        return this.audio.currentTime / this.duration;
    },
    play: function () {
        this.autoPlay = true;
        this.audio.play();
    },
    pause: function () {
        this.autoPlay = false;
        this.audio.pause();
    }
};
/********** AudioManager End ********/

/********** controlManager Start ********/
var controlManager = (function () {
    // dom结构
    var $songImg = $scope.find('.song-img img'),
        $songInfo = $scope.find('.song-info'),
        // 点赞按钮和播放按钮
        $likeBtn = $scope.find('.like-btn'),
        $playBtn = $scope.find('.play-btn'),
        // 当前时间和总时长dom结构
        $timeCur = $scope.find('.cur-time'),
        $timeDuration = $scope.find('.all-time'),
        $proTop = $scope.find('.pro-top'),
        // 用来存储用户点赞信息，true为已赞，false未赞
        // 存在本地只是为了模拟
        likeList = [false, false, false, false, false],
        frameId;


    // 绑定控制事件
    function addControlEvent() {
        $playBtn.on('click', function () {
            if ($(this).hasClass('playing')) {
                audioManager.pause();
                cancelAnimationFrame(frameId);
            } else {
                audioManager.play();
                setProcess();
            }
            $(this).toggleClass('playing');
        });
        $('.next-btn').on('click', function () {
            audioManager.playNext();
        });
        $('.prev-btn').on('click', function () {
            audioManager.playPrev();
        });
        $('.like-btn').on('click', function () {
            var index = audioManager.index;

            if (likeList[index]) {
                return false;
            } else {
                $('.like-btn').addClass('disabled');
                likeList[index] = true;
            }
        });
    }

    // 格式化 时间
    function formatTime(during) {
        var minute = Math.floor(during / 60),
            second = during - minute * 60;

        // 确保是两位
        if (minute < 10) {
            minute = '0' + minute;
        }
        if (second < 10) {
            second = '0' + second;
        }

        return minute + ':' + second;
    }

    // 设置进度条translate
    function setProTopTranslate(translatePercent) {
        var val = translatePercent;

        if (translatePercent != 0) {
            val = translatePercent + '%';
        }


        $proTop.css({
            transform: 'translateX(' + val + ')',
            '-webkit-transform': 'translateX(' + val + ')'
        });
    }

    // 设置播放时进度条
    function setProcess() {
        cancelAnimationFrame(frameId); // 如果这里不清除，每setaudio一次就会设置一个animationframe，导致bug

        var frame = function () {
                var playRatio = audioManager.getPlayRation(),
                    translatePercent = (playRatio - 1) * 100,
                    time = formatTime(audioManager.getCurTime());

                $timeCur.text(time);

                if (translatePercent <= 1) {
                    setProTopTranslate(translatePercent);
                    frameId = requestAnimationFrame(frame);
                } else {
                    setProTopTranslate(0);
                    cancelAnimationFrame(frameId);
                }
            };
        frame();
    }

    // 重置进度条
    function resetProcess() {
        setProTopTranslate(-100);

        $timeCur.text('00:00');
    }

    // 渲染页面信息
    function renderPage() {
        var curData = audioManager.getCurInfo(),
            setImage = function (src) {
                var img = new Image();

                $(img).on('load', function () {
                    $songImg.attr('src', src);
                    blurImg(this, $('.content-wrap'));
                });

                img.src = src;
            };

        // 设置歌曲信息
        renderInfo(curData);
        // 设置专辑图片和背景模糊图
        setImage(curData.image);
        // 渲染总时间
        $timeDuration.text(formatTime(audioManager.getDurationTime()));
        // 渲染like按钮
        if (likeList[audioManager.index]) {
            $likeBtn.addClass('disabled');
        } else {
            $likeBtn.removeClass('disabled');
        }
    }

    // 渲染歌曲信息
    function renderInfo(info) {
        var html = '<h1 class="song-name">' + info.song + '</h1>' +
            '<h3 class="singer-name">' + info.singer + '</h3>' +
            '<h3 class="album-name">' + info.album + '</h3>' +
            '<h3 class="rhythm">' + info.rhythm + '</h3>' +
            '<h3 class="lyric">' + info.lyric + '</h3>';


        $songInfo.html(html);
    }

    // 绑定进度条touch事件
    function addProcessEvent() {
        var $slidePoint = $('.slide-point'),
            $proTop = $('.pro-top'),
            offsetX = $('.pro-wrap').offset().left,
            width = $('.pro-wrap').width();

        $slidePoint.on('touchstart', function () {
            // 在开始touch的时候取消掉设置进度条，将控制权交给toouch事件
            cancelAnimationFrame(frameId);
        }).on('touchmove', function (e) {
            var x = e.changedTouches[0].clientX - offsetX,
                ration = x / width,
                translatePercent = (ration - 1) * 100,
                time = formatTime(audioManager.getCurTime(ration));

            if (ration > 1) {
                return false;
            }

            $timeCur.text(time);

            $proTop.css({
                transform: 'translateX(' + translatePercent + '%)',
                '-webkit-transform': 'translateX(' + translatePercent + '%)'
            });

            return false;
        }).on('touchend', function (e) {
            var ratio = (e.changedTouches[0].clientX - offsetX) / width;

            audioManager.jumpToPlay(ratio);
            $playBtn.addClass('playing');
            setProcess();
        });
    }

    // 初始
    var init = function () {
        renderPage();
        addControlEvent();
        addProcessEvent();
        $scope.on('changeAudio', function () {
            $loadingLayer.show();
            renderPage();
            // 优化点 如果是默认播放的话再setProcess
            // 如果是暂停状态下，需要resetProcess
            // 减少不必要的运算
            if (audioManager.autoPlay) {
                setProcess();
            } else {
                resetProcess();
            }
        });
    };

    return {
        init: init
    }
})();

/********** controlManager End ********/

// 音频管理对象
var audioManager;
/***** 通过 ajax 取数据 *******/
var success = function (d) {
    // 初始化 audioManager
    audioManager = new AudioManager(d);

    controlManager.init();
    // 渲染播放列表
    playList.init(d);
};

function getData(url, cb) {
    $.ajax({
        url: url,
        type: 'GET',
        success: cb,
        error: function () {
            alert('deal wrong');
        }
    })
}

getData(dataUrl, success);

/********** END *********/

var playList = (function () {

    var $playList = $scope.find('.play-list'),
        $container = $scope.find('ul');

    function renderList(data) {
        var html = '';

        for (var len = data.length, i = 0; i < len; i++) {
            var cur = data[i];

            html += '<li data-index="' + i + '"><h3>' + cur.song + '<span> - ' + cur.singer + '</span></h3></li>';
        }

        $container.html(html);
    }

    function show() {
        $container.find('li').removeClass('playing').eq(audioManager.index).addClass('playing');
        $playList.addClass('show');
    }

    function hide() {
        $playList.removeClass('show');
    }

    function bindHash() {
        //  绑定 hashchange 事件
        $(window).on('hashchange', function (e) {
            var param = location.hash.replace('#', '').split('/');

            if (param[0] === 'playlist') {
                show();
            } else {
                hide();
            }
        });
        // 手动触发一下
        if (location.hash) {
            $(window).trigger('hashchange');
        }
    }

    function bindEvent() {
        var $listBtn = $scope.find('.list-btn'),
            $closeBtn = $playList.find('.close-btn');

        // 打开播放列表
        $listBtn.on('click', function () {
            location.hash = 'playlist';
        });
        // 点击播放列表歌曲
        $playList.on('click', 'li', function () {
            var self = $(this),
                index = self.data('index');

            self.siblings('.playing').removeClass('playing');
            self.addClass('playing');
            audioManager.playIndex(index);
            $('.play-btn').addClass('playing');

            setTimeout(function () {
                $closeBtn.trigger('click');
            }, 500)
        });
        // 点击关闭按钮
        $closeBtn.on('click', function () {
            location.hash = '';
        });
    }

    function init(data) {
        renderList(data);
        bindHash();
        bindEvent();
    }

    return {
        init: init
    }

})();
