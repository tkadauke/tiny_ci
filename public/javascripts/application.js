$(document).observe('dom:loaded', function() {
  if ($('report'))
    Report.attach();
  focusFirstField();
});

var Report = {
  update: function() {
    Report.measureWindow();
    new Ajax.Updater('build', document.location.href, { method: 'get', onComplete: Report.afterUpdate })
  },
  
  attach: function() {
    $('report').getElementsBySelector('a').each(function(link) {
      link.observe('click', function(event) {
        Effect.toggle(link.up().down('div'), 'blind', { duration: 0.3 });
        event.stop();
      });
    });
  },
  
  measureWindow: function() {
    Report.documentHeight = $(document.body).getDimensions().height;
    Report.viewportHeight = document.viewport.getDimensions().height;
    Report.scrollOffset = document.viewport.getScrollOffsets().top;
  },
  
  afterUpdate: function() {
    Report.attach();
    if (Report.scrollOffset + Report.viewportHeight + 100 >= Report.documentHeight) {
      $('bottom_anchor').scrollTo();
    }
  }
};

var Queue = {
  update: function() {
    new Ajax.Updater('queue', document.location.href, { method: 'get' })
  }
}

function focusFirstField() {
  var field = $$('input[type="text"]').first();
  if (field)
    field.focus();
}
