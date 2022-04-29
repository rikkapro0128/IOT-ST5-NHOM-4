$(function () {
  // Handler for .ready() called.
  // global variable 
  const numberSecondWaits = 15 * 1000;
  const messageDisableByWait = 'bạn có thể nhấn sau';
  const timeShowToast = 3000;
  const TITLE = {
    switch: {
      on: 'bật',
      off: 'tắt',
    },
    touch: {
      on: 'chạm',
      off: 'không chạm',
    },
    smoke: {
      detach: 'có khói',
      un_detach: 'không khói',
    },
  };
  const manageDevice = [
    {
      field: 'light',
      id: 1716053,
      type: 'digital',
      wait: false,
      timeWaitRemain: 0,
      api_key: '0OBH7KJFUZ34STBY',
    },
    {
      field: 'fans',
      id: 1716052,
      type: 'digital',
      wait: false,
      timeWaitRemain: 0,
      api_key: 'JAQHPWZTHOO8ENA8',
    },
    {
      field: 'rbg_led',
      id: 1716054,
      type: 'hex',
      wait: false,
      timeWaitRemain: 0,
      api_key: 'BFG26RKKLXT4CJ0Q',
    },
  ]

  const manageSensor = {
    idChannle: 1716046,
    fields: {
      field1: 'temp',
      field2: 'humi',
      field3: 'smoke',
      field4: 'touch',
    }
  }

  initStateDefault(); // init state view default

  $('.state--node').click(function () {
    $('.miru--modal__raspberry').modal('show');
  })
  for (const ele of $('.miru--checkbox > .behavior')) {
    $(ele).click(handleCheckBox);
  }

  function showToast(message = 'no message!', type = 'notify', time = -1) {
    if($(window).width() > 786) {
      Toastify({
        text: message,
        className: `miru--toast miru--${type}`,
        offset: {
          x: '3rem', // horizontal axis - can be a number or a string indicating unity. eg: '2em'
          y: '3rem' // vertical axis - can be a number or a string indicating unity. eg: '2em'
        },
        duration: -1,
        close: true,
        gravity: 'bottom',
        position: 'right',
        backgroundColor: '#fff',
        duration: time,
        avatar: `${type === 'notify' ? 'assets/images/notification-pngrepo-com.png' : (type === 'error' ? 'assets/images/error-pngrepo-com.png' : 'assets/images/warning-pngrepo-com.png')}`,
      }).showToast();
    }else {
      $('.miru--modal__toast').find('.title').text(message);
      $('.miru--modal__toast').modal('show');
    }
  }

  function handleCheckBox(e) {

    const ele = $(e.target);
    let indexDevice;
    const item = manageDevice.find((value, index) => { if (value.field === ele.closest('.miru--checkbox').attr('data-field')) { indexDevice = index; return true; } });
    // console.log(item);
    if (item.api_key && !item.wait) {
      if (ele.hasClass('active')) {
        setValueByChannle(item.api_key, { field1: 0 }, indexDevice)
          .then((data) => {
            if (data !== 0) {
              ele.removeClass('active');
              ele.siblings('.label').text('tắt');
            } else {
              showToast(`không thể thay đổi trạng thái thiết bị ${item.field}`, 'error', timeShowToast);
            }
          })
      } else {
        setValueByChannle(item.api_key, { field1: 1 }, indexDevice)
          .then((data) => {
            if (data !== 0) {
              ele.addClass('active');
              ele.siblings('.label').text('mở');
            } else {
              showToast(`không thể thay đổi trạng thái thiết bị ${item.field}`, 'error', timeShowToast);
            }
          })
      }
    } else {
      showToast(`${messageDisableByWait} ${item.timeWaitRemain / 1000}s`, 'warming', timeShowToast);
    }

  }

  function setValueByChannle(api_key, value, indexDevice) {
    manageDevice[indexDevice].wait = true;
    manageDevice[indexDevice].timeWaitRemain = numberSecondWaits;
    let stack = setInterval(() => { manageDevice[indexDevice].timeWaitRemain -= 1000 }, 1000);
    setTimeout(() => {
      manageDevice[indexDevice].wait = false;
      clearInterval(stack);
    }, numberSecondWaits)
    return new Promise((res, rej) => {
      fetch(`https://api.thingspeak.com/update.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: api_key,
          ...value,
        })
      })
        .then((res) => res.json())
        .then(data => res(data))
        .catch(err => rej(err))
    })
  }

  function getValueByChannle(chanleID, type = 'single') {
    return new Promise((res, rej) => {
      fetch(`https://api.thingspeak.com/channels/${type === 'single' ? `${chanleID}/fields/1` : `${chanleID}/feeds`}/last.json`)
        .then((res) => res.json())
        .then(data => res(data))
        .catch(err => rej(err))
    })
  }

  function initStateDefault() {
    const queu = new Array();

    setInterval(() => {
      getValueByChannle(manageSensor.idChannle, 'muti')
        .then(data => {
          for (const field of Object.entries(manageSensor.fields)) {
            if (field[1] === 'smoke') {
              $(`.${field[1]}.sensor__nav--item`).find('.nav--center--val').first().text(data[field[0]] ? TITLE.smoke.detach : TITLE.smoke.un_detach);
            } else if (field[1] === 'touch') {
              $(`.${field[1]}.sensor__nav--item`).find('.nav--center--val').first().text(data[field[0]] ? TITLE.touch.on : TITLE.touch.off);
            } else {
              $(`.${field[1]}.sensor__nav--item`).find('.nav--center--val').first().text(data[field[0]]);
            }
          }
        })
    }, numberSecondWaits / 3);

    for (const device of Object.entries(manageDevice)) {
      queu.push(getValueByChannle(device[1].id))
    }

    Promise.all(queu)
      .then(data => {
        data.forEach((value, index) => {
          const el = $(`.miru--checkbox[data-field=${manageDevice[index].field}] > .behavior`);
          if (value.field1 === '-1' || value.field1 === '0') {
            if (manageDevice[index].type === 'digital') {
              el.removeClass('active');
              el.siblings('span.label').text(TITLE.switch.off);
            }
          } else {
            if (manageDevice[index].type === 'digital') {
              el.addClass('active');
              el.siblings('span.label').text(TITLE.switch.on);
            }
          }
        })
      })
  }

});

