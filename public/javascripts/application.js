$(document).observe('dom:loaded', function() {
  $$('.report').each(function(report) {
    report.getElementsBySelector('li a').each(function(link) {
      link.observe('click', function(event) {
        Effect.toggle(link.up('li').down('div'), 'blind', { duration: 0.3 });
        event.stop();
      });
    });
  });
});
