var defaultUserData = { author: '', soundOn: true, firstRun: true }
  , userData = JSON.parse(window.localStorage.getItem('userData')) || defaultUserData
  , welcomeBack = window.localStorage.getItem('userData') !== null
  , defaultTitle = document.title
  , mountNode = document.getElementsByTagName('body')[0]
  , sock = null
  , lastMessage = null
  , nano = null
  , watchConnectionInterval = null
  , updateInterval = null
  , version = null
  , browserStatus = {
      focused: false
    , readCount: 0
    , unreadCount: 0
    , connected: false
    };

window.addEventListener('blur', function () {
  browserStatus.focused = false;
});

window.addEventListener('focus', function () {
  browserStatus.focused = true;
});

function MessageObj (str) {
  var obj = typeof str === 'string' ? JSON.parse(str) : str;
  this.author = obj.author;
  this.date = obj.date;
  this.body = obj.body;
}

function formatMessage (message) {
  message = message.trim();

  if (message.search(/^>/) === 0) {
    message = '<span class=\'implying\'>' + message + '</span>';
  }

  message = message
    .replace(/((http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?)/g, '<a href="$1" target="_blank">$1</a>')
    .replace(/\n\s/g, '<br>');

  return message;
}

function updateUserData (obj) {
  _
    .chain(userData)
    .keys()
    .forEach(function (key) {
      if (obj.hasOwnProperty(key)) {
        userData[key] = obj[key];
      }
    });

  window.localStorage.setItem('userData', JSON.stringify(userData));
}

var Message = React.createClass({
  getInitialState: function () {
    return {
      author: '',
      date: '',
      body: ''
    };
  },

  render: function () {
    var date = moment(this.props.date)
      , classes = React.addons.classSet({
        'message': true,
        'message-me': this.props.author === userData.author
        // 'message-lu': this.props.author.toLowerCase() === 'lu'
      });

    return (
      <div className={classes}>
        <div className='message-author'>{this.props.author}</div>
        <div className='message-body'>
          <span className='message-date' title={date.format('DD/MM/YYYY HH:mm')}>{date.format('HH:mm')}</span>
          <span dangerouslySetInnerHTML={{__html: this.props.children.toString()}}></span>
        </div>
      </div>
    );
  }
});

var NanoScrollerWrapper = React.createClass({
  render: function () {
    return (
      <div className='nano'>
        <div className='nano-content'>
          {this.children.toString()}
        </div>
      </div>
    );
  }
});

var SoundNotificationView = React.createClass({
  play: function () {
    if (userData.soundOn) {
      var elem = this.refs.notification.getDOMNode();
      elem.play();
    }
  },

  stop: function () {
    var elem = this.refs.notification.getDOMNode();
    elem.pause();
    elem.currentTime = 0;
  },

  componentDidMount: function () {
    this.refs.notification.getDOMNode().volume = 0.4;
  },

  render: function () {
    return (
      <audio ref='notification' className='hidden'>
        <div className='icon-no-sound'>!</div>
        <source src='/sounds/Looking Up.mp3' type='audio/mp3' />
        <source src='/sounds/Looking Up.wav' type='audio/wav' />
      </audio>
    );
  }
});

var MessageList = React.createClass({
  getInitialState: function () {
    return {
      messages: []
    };
  },

  fetchMessages: function () {
    // $.get('/messages', function (data) {
    //   this.setState({ messages: data });
    // }.bind(this));
  },

  updateMessages: function (data) {
    var messages = this.state.messages;
    messages.push(new MessageObj(data));
    this.setState({ messages: messages }, this.scroll);
  },

  scroll: function () {
    nano.nanoScroller();
    if (browserStatus.focused) {
      nano.nanoScroller({ scrollTo: nano.find('.message').last() });
    }
  },

  createMessageElem: function (message) {
    return (
      <Message key={message.date} author={message.author} date={new Date(message.date)}>
        {formatMessage(message.body)}
      </Message>
    );
  },

  updateTitle: function () {
    if (browserStatus.focused) {
      browserStatus.readCount = this.state.messages.length;
      browserStatus.unreadCount = 0;
    }
    else {
      browserStatus.unreadCount = this.state.messages.length - browserStatus.readCount;
      if (browserStatus.unreadCount > 0) {
        this.refs.notificationElem.play();
      }
    }

    document.title = browserStatus.unreadCount > 0 ? '(' + browserStatus.unreadCount + ') ' + defaultTitle : defaultTitle;
  },

  resize: function (e) {
    var h = window.innerHeight
      , form_h = Math.ceil($('.form-wrapper').height())
      , header_h = $('header').height()
      , bottomMargin = 40
      , newHeight = h - (form_h + header_h + bottomMargin);

    $(this.refs.baseElem.getDOMNode()).height(newHeight);
    $('.nano-content').height(newHeight);
    nano.nanoScroller();
  },

  componentWillMount: function () {
    sock.onmessage = function (e) {
      this.updateMessages(e.data);
    }.bind(this);
  },

  componentDidMount: function () {
    nano = $('.nano');
    nano.nanoScroller();
    this.resize();
    window.addEventListener('focus', this.updateTitle);
    window.addEventListener('resize', this.resize);
  },

  componentWillUnmount: function () {
    window.removeEventListener('focus', this.updateTitle);
  },

  render: function () {
    var messages = this.state.messages.map(function (message) {
      return this.createMessageElem(message);
    }, this);

    this.updateTitle();

    return (
      <div className='message-box nano' ref='baseElem'>
        <SoundNotificationView src='sounds/Looking Up.wav' ref='notificationElem' />
        <div className='nano-content'>
          {messages}
        </div>
      </div>
    );
  }
});

var FormView = React.createClass({
  getInitialState: function () {
    return {
      value: ''
    };
  },

  handleKeypress: function (e) {
    var which = e.which || w.keyCode
      , input
      , value;

    if (which === 13) {
      input = this.refs.messageInput.getDOMNode();
      value = input.value;

      if (e.shiftKey) {
        input.value += '\n';
      }
      else {
        this.submitMessage(value);
      }
    }
  },

  submitMessage: function (message) {
    if (message.trim().length === 0) {
      return;
    }

    sock.send(JSON.stringify({
      author: userData.author,
      body: message
    }));

    this.clear();
  },

  clear: function () {
    this.refs.messageInput.getDOMNode().value = '';
    this.focusMessageInput();
  },

  focusMessageInput: function () {
    this.refs.messageInput.getDOMNode().focus();
  },

  componentDidMount: function () {
    window.addEventListener('focus', this.focusMessageInput);
  },

  componentWillUnmount: function () {
    window.removeEventListener('focus', this.focusMessageInput);
  },

  render: function () {
    return (
      <div className='form-wrapper'>
        <div className='form-holder'>
          <textarea className='form-control form-input' onKeyPress={this.handleKeypress} ref='messageInput' maxLength='255'></textarea>
          <span className='glyphicon glyphicon-camera upload-icon' title='Upload an image'></span>
        </div>
      </div>
    );
  }
});

var NotificationsView = React.createClass({
  getInitialState: function () {
    return {
      connected: false,
      hasUpdate: false,
      soundOn: userData.soundOn
    };
  },

  getUpdates: function () {
    $.get('/u', function (data) {
      if (version === null) {
        version = data.version;
      }
      else if (data.version !== version) {
        clearInterval(updateInterval);
        this.setState({ hasUpdate: true });
      }
    }.bind(this));
  },

  watchConnectionStatus: function () {
    watchConnectionInterval = setInterval(function () {
      this.setState({
        connected: browserStatus.connected
      });
    }.bind(this), 1000);
  },

  refreshWindow: function () {
    window.location.reload();
  },

  setSoundState: function (state) {
    this.setState({
      soundOn: state
    });

    updateUserData(userData);
  },

  mute: function () {
    this.setSoundState(userData.soundOn = false);
  },

  unmute: function () {
    this.setSoundState(userData.soundOn = true);
  },

  componentWillMount: function () {
    this.getUpdates();
    updateInterval = setInterval(this.getUpdates, 10000);
  },

  componentDidMount: function () {
    if (userData.firstRun) {
      this.unmute();
      updateUserData({firstRun: false});
    }
    this.watchConnectionStatus();
  },

  render: function () {
    var updateClasses = React.addons.classSet({
      'horse-icon': true,
      'horse-icon-primary': true,
      'horse-icon-update': true,
      'hidden': !this.state.hasUpdate
    });

    var connectionClasses = React.addons.classSet({
      'horse-icon': true,
      'horse-icon-primary': this.state.connected,
      'horse-icon-err': !this.state.connected
    });

    var soundClasses = React.addons.classSet({
      'horse-icon': true,
      'horse-icon-primary': this.state.soundOn
    });

    var soundIconClasses = React.addons.classSet({
      'glyphicon': true,
      'glyphicon-volume-up': this.state.soundOn,
      'glyphicon-volume-off': !this.state.soundOn
    });

    return (
      <div className='notifications'>
        <span className={updateClasses} title="There's a new version! Refresh your browser or click me!" onClick={this.refreshWindow}>!</span>
        <span className={soundClasses} onClick={this.state.soundOn ? this.mute : this.unmute}><span className={soundIconClasses}></span></span>
        <span className={connectionClasses} title={this.state.connected ? 'Online' : 'Disconnected'}><span className='glyphicon glyphicon-flash'></span></span>
      </div>
    );
  }
});

var HeaderView = React.createClass({
  getInitialState: function () {
    return {
      author: this.props.author,
      hideNameInput: true
    };
  },

  showInput: function () {
    this.setState({
      hideNameInput: false
    }, function () {
      var input = this.refs.newName.getDOMNode()
        , length = this.state.author.length;

      input.focus();
      input.value = this.state.author;
      window.teste = input;

      input.setSelectionRange(length, length);
    });
  },

  handleKeypress: function (e) {
    var which = e.which || e.keyCode;

    if (which === 13) {
      this.changeAuthorName(this.refs.newName.getDOMNode().value);
    }
  },

  handleBlur: function (e) {
    this.changeAuthorName(this.refs.newName.getDOMNode().value);
  },

  changeAuthorName: function (name) {
    name = name.trim();

    if (!name.length) {
      return;
    }

    this.setState({
      author: name,
      hideNameInput: true
    });

    updateUserData(this.state);
  },

  render: function () {
    var authorClasses = React.addons.classSet({
      'author-name': true,
      'hidden': !this.state.hideNameInput
    });

    var inputClasses = React.addons.classSet({
      'new-name': true,
      'hidden': this.state.hideNameInput
    });

    return (
      <header>
        <h2>Welcome{welcomeBack ? ' back' : ''}, <span className='author-name-wrapper'><span className={authorClasses} onClick={this.showInput} title='Click to change your name'>{this.state.author}</span><input className={inputClasses} ref='newName' onKeyPress={this.handleKeypress} onBlur={this.handleBlur} /></span></h2>
        <NotificationsView />
      </header>
    );
  }
});

var AppView = React.createClass({
  render: function () {
    return (
      <div className='container'>
        <HeaderView author={userData.author} />
        <MessageList />
        <FormView />
      </div>
    );
  }
});

var SplashView = React.createClass({
  getInitialState: function () {
    return {
      hidden: false
    };
  },

  handleKeypress: function (e) {
    var key = e.which || e.keyCode
      , name = e.target.value;

    name = name.trim();

    if (key === 13 && name.length > 0) {
      this.setName(name);
    }
  },

  setName: function (name) {
    updateUserData({author: name});
    this.hide();
    this.createSocket();
  },

  createSocket: function () {
    if (sock === null) {
      sock = new SockJS('/echo-' + window.location.port);

      sock.onopen = function (e) {
        browserStatus.connected = true;
        browserStatus.serverId = sock._server;
        console.log(browserStatus);
        // console.log(sock);
        sock.send(JSON.stringify({
          id: browserStatus.serverId,
          user: userData.author
        }));
        console.log('SockJS connected');
        this.renderApp();
      }.bind(this);

      sock.onclose = function () {
        browserStatus.connected = false;
        console.log('close');
      };

      sock.onerror = function (err) {
        console.error('Error:', err);
      };
    }
  },

  getSocket: function () {
    return sock;
  },

  renderApp: function () {
    React.renderComponent(<AppView socket={this.getSocket()}></AppView>, mountNode);
  },

  hide: function () {
    this.setState({hidden: true});
  },

  componentWillMount: function () {
    // check if already has localStorage userData
    if (userData && userData.author.trim().length > 0) {
      this.hide();
      this.createSocket();
    }
  },

  componentDidMount: function () {
    this.refs.authorName.getDOMNode().focus();
  },

  render: function () {
    var classes = React.addons.classSet({
      'splash-screen': true,
      'overlay': true,
      'hidden': this.state.hidden
    });

    return (
      <div className={classes}>
        <h1>Horse chat</h1>
        <div className='ask-name'>
          <input className='form-control text-center' ref='authorName' placeholder='Enter your name' onKeyPress={this.handleKeypress} autoComplete='off' autoCorrect='off' />
        </div>
      </div>
    );
  }
});

React.renderComponent(<SplashView />, mountNode);
