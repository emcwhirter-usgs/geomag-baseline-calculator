/* global observatoryId */
'use strict';

var ObservatoryView = require('geomag/ObservatoryView'),
    User = require('geomag/User');

var id = observatoryId,
    user = User.getCurrentUser();

if (user.get('admin') !== 'Y') {
  id = parseInt(user.get('default_observatory_id'), 10);
}

new ObservatoryView({
  el: document.querySelector('.observatory-view'),
  observatoryId: id
});