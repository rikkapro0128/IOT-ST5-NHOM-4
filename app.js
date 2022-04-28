
$(function () {
  // Handler for .ready() called.
  // global variable 
  const numberSecondWaits = 15 * 1000;
  const manageDevice = [
    {
      field: 'light',
      id: 1716053,
      type: 'digital',
      wait: false,
      api_key: '0OBH7KJFUZ34STBY',
    },
    {
      field: 'fans',
      id: 1716052,
      type: 'digital',
      wait: false,
      api_key: 'JAQHPWZTHOO8ENA8',
    },
    {
      field: 'rbg_led',
      id: 1716054,
      type: 'hex',
      wait: false,
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


  function handleCheckBox(e) {

    const ele = $(e.target);
    let indexItem;
    const item = manageDevice.find((value, index) => { if (value.field === ele.closest('.miru--checkbox').attr('data-field')) { indexItem = index; return true; } });

    if (item.api_key) {
      if (ele.hasClass('active')) {
        setValueByChannle(item.api_key, { field1: 0 })
          .then((data) => {
            if (data !== 0) {
              ele.removeClass('active');
              ele.siblings('.label').text('tắt');
            } else {
              console.log('show toast!');
            }
          })
      } else {
        setValueByChannle(item.api_key, { field1: 1 })
          .then((data) => {
            if (data !== 0) {
              ele.addClass('active');
              ele.siblings('.label').text('mở');
            } else {
              console.log('show toast!');
            }
          })
      }
    }

  }

  function setValueByChannle(api_key, value) {
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
            if(field[1] === 'smoke') {
              $(`.${field[1]}.sensor__nav--item`).find('.nav--center--val').first().text(data[field[0]] ? 'có khói' : 'không khói' );
            }else if(field[1] === 'touch') {
              $(`.${field[1]}.sensor__nav--item`).find('.nav--center--val').first().text(data[field[0]] ? 'chạm' : 'không chạm' );
            }else {
              $(`.${field[1]}.sensor__nav--item`).find('.nav--center--val').first().text(data[field[0]]);
            }
          }
          // $(`.${manageSensor[field1]}.sensor__nav--item`)
        })
    }, numberSecondWaits / 3);

    for (const device of Object.entries(manageDevice)) {
      queu.push(getValueByChannle(device[1].id))
    }

    Promise.all(queu)
      .then(data => {
        data.forEach((value, index) => {
          // manageDevice[index].wait = true;
          // setTimeout(() => manageDevice[index].wait = false, numberSecondWaits)
          if (value.field1 === '-1' || value.field1 === '0') {
            if (manageDevice[index].type === 'digital') {
              $(`.miru--checkbox[data-field=${manageDevice[index].field}] > .behavior`).removeClass('active');
            }
          } else {
            if (manageDevice[index].type === 'digital') {
              $(`.miru--checkbox[data-field=${manageDevice[index].field}] > .behavior`).addClass('active');
            }
          }
        })
      })
  }

});

