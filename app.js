$(function () {
  // Handler for .ready() called.
  $('.state--node').click(function() {
    $('.miru--modal__raspberry').modal('show');
  })
  for (const ele of $('.miru--checkbox > .behavior')) {
    $(ele).click(handleCheckBox);
  }
});

function handleCheckBox(e) {
  if ($(e.target).hasClass('active')) {
    $(e.target).removeClass('active')
    $(e.target).siblings('.label').text('tắt')
  } else {
    $(e.target).addClass('active')
    $(e.target).siblings('.label').text('mở')
  }
}
