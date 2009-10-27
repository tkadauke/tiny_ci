$(document).observe('dom:loaded', function() {
  Report.attach();
});

var Report = {
  update: function() {
    new Ajax.Updater('report', document.location.href, { method: 'get', onComplete: function() { Report.attach(); $('bottom_anchor').scrollTo(); } })
  },
  
  attach: function() {
    $('report').getElementsBySelector('a').each(function(link) {
      link.observe('click', function(event) {
        Effect.toggle(link.up().down('div'), 'blind', { duration: 0.3 });
        event.stop();
      });
    });
  }
};
