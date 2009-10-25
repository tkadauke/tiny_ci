$(document).observe('dom:loaded', function() {
  $$('.report').each(function(report) {
    report.getElementsBySelector('a').each(function(link) {
      link.observe('click', function(event) {
        Effect.toggle(link.up().down('div'), 'blind', { duration: 0.3 });
        event.stop();
      });
    });
  });
});
