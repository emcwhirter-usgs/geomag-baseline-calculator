/* global MOUNT_PATH */
'use strict';

var Collection = require('mvc/Collection'),
    CollectionSelectBox = require('mvcutil/CollectionSelectBox'),
    Util = require('util/Util'),
    View = require('mvc/View'),

    Format = require('geomag/Formatter'),
    User = require('geomag/User'),
    UserFactory = require('geomag/UserFactory'),
    Validate = require('geomag/Validate');


// default constructor options
var _DEFAULTS = {
  observatoryId: null,
  userFactory: UserFactory({
    url: MOUNT_PATH + '/user_data.php'
  })
};

// unique id prefix for form elements
var _IDPREFIX = 'observationmetaview-';

// unique id sequence for form elements
var _SEQUENCE = 0;


/**
 * Utility function to select a collection item based on item id.
 *
 * If collection is not null, selects collection item with id
 * or triggers deselect if no matching item found.
 *
 * @param collection {Collection}
 *        collection being selected.
 * @param id {Number}
 *        id of collection item to select.
 */
var __select_by_id = function (collection, id) {
  var item = null;
  if (collection !== null) {
    if (id !== null) {
      item = collection.get(id);
    }
    if (item !== null) {
      collection.select(item);
    } else {
      collection.deselect();
    }
  }
};


/**
 * Construct a new ObservationMetaView.
 *
 * @param options {Object}
 *        view options.
 * @param options.calculator {geomag.ObservationBaselineCalculator}
 *        the calculator to use.
 * @param options.observation {Observation}
 *        observation to display.
 */
var ObservationMetaView = function (options) {
  var _this,
      _initialize,

      _admin,
      _calculator,
      _date,
      _electronicsSelectView,
      _marksSelectView,
      _julianDay,
      _observation,
      _observatoryId,
      _observatorySelectView,
      _observatories,
      _observerCollection,
      _observerSelect,
      _observerSelectView,
      _pierSelectView,
      _pierTemperature,
      _reviewerCollection,
      _reviewerSelect,
      _reviewerSelectView,
      _theodoliteSelectView,
      _user,
      _userFactory,

      _createViewSkeleton,
      _getUsers,
      _onDateChange,
      _onPierTempChange,
      _setObservatory,
      _updateErrorState,
      _validateDate;


  _this = View(options);
  /**
   * Initialize view, and call render.
   * @param options {Object} same as constructor.
   */
  _initialize = function (options) {
    options = Util.extend({}, _DEFAULTS, options);

    _calculator = options.calculator;
    _observation = options.observation;
    _observatories = options.observatories || Collection([]);
    _observatoryId = options.observatoryId;

    _userFactory = options.userFactory;
    _user = User.getCurrentUser();

    _observerCollection = options.observerCollection;
    _reviewerCollection = options.reviewerCollection;

    _createViewSkeleton();
    _getUsers();

    // fill in observation inputs
    _this.render();
  };

  _createViewSkeleton = function () {
    var el = _this.el,
        idPrefix = _IDPREFIX + (++_SEQUENCE);

    el.innerHTML = [
      '<section class="observation-meta-view">',
        '<div class="row">',
          '<div class="column one-of-two left-aligned">',
            '<label for="', idPrefix, '-date" class="print-hidden">',
              'Date',
            '</label>',
            '<input id="',  idPrefix, '-date" type="text"',
                ' class="observation-date" placeholder="YYYY-MM-DD"/>',

            '<label for="', idPrefix, '-julian-day" class="print-hidden">',
              'Julian Day',
            '</label>',
            '<input id="', idPrefix, '-julian-day" type="text"',
                ' class="julian-day-value" disabled />',

            '<label for="', idPrefix, '-piertemp" class="print-hidden">',
                'Pier <abbr title="Temperature">Temp</abbr>',
            '</label>',
            '<input id="',  idPrefix, '-piertemp" type="text"',
                ' class="pier-temperature"/>',

            '<label for="', idPrefix, '-observer" class="print-hidden">',
              'Observer',
            '</label>',
            '<select id="', idPrefix, '-observer"',
                ' class="observer-select" disabled="disabled"></select>',

            '<label for="', idPrefix, '-reviewer" class="print-hidden">',
              'Reviewer',
            '</label>',
            '<select id="',  idPrefix, '-reviewer"',
                ' class="reviewer-select" disabled="disabled"></select>',
            '<p class="alert info admin hidden">',
              'Selected reviewer is not an admin user.',
            '</p>',
          '</div>',

          '<div class="column one-of-two left-aligned">',
            '<label for="', idPrefix, '-observatory" class="print-hidden">',
              'Observatory',
            '</label>',
            '<select id="', idPrefix, '-observatory"',
                ' class="observatory"></select>',

            '<label for="', idPrefix, '-pier" class="print-hidden">',
              'Pier',
            '</label>',
            '<select id="', idPrefix, '-pier" class="pier"></select>',

            '<label for="', idPrefix, '-mark" class="print-hidden">',
              'Mark',
            '</label>',
            '<select id="', idPrefix, '-mark" class="mark"></select>',

            '<label for="', idPrefix, '-electronics" class="print-hidden">',
              'Electronics',
            '</label>',
            '<select id="', idPrefix, '-electronics"',
                ' class="electronics"></select>',

            '<label for="', idPrefix, '-theodolite" class="print-hidden">',
              'Theodolite',
            '</label>',
            '<select id="', idPrefix, '-theodolite"',
                ' class="theodolite"></select>',
          '</div>',
        '</div>',
      '</section>'
    ].join('');

    // observatory information inputs
    _observerSelectView = CollectionSelectBox({
      el: el.querySelector('.observer-select'),
      emptyText: 'Loading observers...',
      formatOption: Format.username
    });
    _reviewerSelectView = CollectionSelectBox({
      el: el.querySelector('.reviewer-select'),
      emptyText: 'Loading reviewers...',
      formatOption: Format.username
    });
    _observatorySelectView = CollectionSelectBox({
      el: el.querySelector('.observatory'),
      emptyText: 'Loading observatories...'
    });
    _pierSelectView = CollectionSelectBox({
      el: el.querySelector('.pier'),
      emptyText: 'Select observatory...',
      formatOption: Format.pier
    });
    _marksSelectView = CollectionSelectBox({
      el: el.querySelector('.mark'),
      emptyText: 'Select pier...',
      formatOption: Format.mark
    });
    _electronicsSelectView = CollectionSelectBox({
      el: el.querySelector('.electronics'),
      emptyText: 'Select observatory...',
      formatOption: Format.instrument
    });
    _theodoliteSelectView = CollectionSelectBox({
      el: el.querySelector('.theodolite'),
      emptyText: 'Select observatory...',
      formatOption: Format.instrument
    });

    // observation inputs
    _admin = el.querySelector('.admin');
    _date = el.querySelector('.observation-date');
    _julianDay = el.querySelector('.julian-day-value');
    _pierTemperature = el.querySelector('.pier-temperature');
    _observerSelect = el.querySelector('.observer-select');
    _reviewerSelect = el.querySelector('.reviewer-select');

    _date.addEventListener('change', _onDateChange);

    // This makes sure the Julian day updates, among other things
    _observation.on('change', 'render', _this);
    _pierTemperature.addEventListener('change', _onPierTempChange);


    _observatorySelectView.on('change', function (selected) {
      // currently selected observatory
      var observatory_id = _observation.get('observatory_id');

      // disable dependent select boxes until observatory loads
      _pierSelectView.disable();
      _marksSelectView.disable();
      _electronicsSelectView.disable();
      _theodoliteSelectView.disable();

      if (selected === null) {
        // no selection
        _observation.set({observatory_id: null});
      } else {
        if (observatory_id !== selected.id) {
          // different observatory, clear mark and instrument attributes
          _observation.set({
            observatory_id: selected.id,
            mark_id: null,
            electronics_id: null,
            theodolite_id: null
          });
          // clear calculator settings
          _calculator.set({
            pierCorrection: 0,
            trueAzimuthOfMark: 0
          });
        }
        // load observatory details
        selected.getObservatory({
          success: function (observatory) {
            _setObservatory(observatory);
          }
        });
      }
    });

    _observerSelectView.on('change', function (observer) {
      var observer_id;

      observer_id = _observation.get('observer_user_id');

      if (observer === null) {
          _observation.set({
            observer_user_id: (observer_id ? observer_id : _user.get('id'))
          });
      } else {
        _observation.set({
          observer_user_id: observer.id
        });
      }
    });

    _reviewerSelectView.on('change', function (reviewer) {
      var reviewer_id;

      reviewer_id = _observation.get('reviewer_user_id');

      if (reviewer === null) {
          _observation.set({
            reviewer_user_id: (reviewer_id ? reviewer_id : _user.get('id'))
          });
      } else {
        _observation.set({
          reviewer_user_id: reviewer.id
        });

        if (reviewer.get('admin') === 'Y') {
          _admin.classList.add('hidden');
        } else {
          _admin.classList.remove('hidden');
        }
      }
    });

    _pierSelectView.on('change', function (pier) {
      var marks = null,
          mark_id = null,
          mark = null,
          pierCorrection = 0,
          trueAzimuthOfMark = 0;

      if (pier !== null) {
        pierCorrection = pier.get('correction');
        // update mark
        marks = pier.get('marks');
        mark_id = _observation.get('mark_id') ||
            pier.get('default_mark_id');
        mark = marks.get(mark_id);
        if (mark !== null) {
          marks.select(mark);
          trueAzimuthOfMark = mark.get('azimuth');
        }
        // set defaults
        if (_observation.get('electronics_id') === null) {
          _electronicsSelectView.selectById(
              pier.get('default_electronics_id'));
        }
        if (_observation.get('theodolite_id') === null) {
          _theodoliteSelectView.selectById(
              pier.get('default_theodolite_id'));
        }
      }
      // azimuth is also set by marksSelectView.setCollection when
      // mark changes, set now to prevent a double "change" event
      _calculator.set({
        pierCorrection: pierCorrection,
        trueAzimuthOfMark: trueAzimuthOfMark
      });
      _marksSelectView.setCollection(marks);
    });

    _marksSelectView.on('change', function (mark) {
      var mark_id = null,
          trueAzimuthOfMark = 0;

      if (mark !== null) {
        mark_id = mark.id;
        trueAzimuthOfMark = mark.get('azimuth');
      }
      _observation.set({mark_id: mark_id});
      _calculator.set({trueAzimuthOfMark: trueAzimuthOfMark});
    });

    _electronicsSelectView.on('change', function (selected) {
      _observation.set({
        electronics_id: (selected === null ? null : selected.id)
      });
    });

    _theodoliteSelectView.on('change', function (selected) {
      _observation.set({
        theodolite_id: (selected === null ? null : selected.id)
      });
    });

    // load observatories collection
    _observatorySelectView.setCollection(_observatories);
    _observatorySelectView.selectById(_observatoryId);
  };

  /**
   * Input element change handler.
   *
   * Updated observation begin and pier_temperature attributes from form.
   */

  _getUsers = function () {
    // _userFactory.get({
    //   success: function (data) {
    //     data = data.map(function (info) {return User(info);});
    //
    //     data.sort(function(a, b) {
    //       // sort alphabetically by username.
    //       if (a.get('username') < b.get('username')) {
    //         return -1;
    //       } else {
    //         return 1;
    //       }
    //     });
    //
    //     _observerCollection = Collection(data);
    //     _reviewerCollection = Collection(data);
    //
    //     // load observers collection
    //     _observerSelectView.setCollection(_observerCollection);
    //     _observerSelectView.selectById(_observation.get('observer_user_id'));
    //     // load reviewers collection
    //     _reviewerSelectView.setCollection(_reviewerCollection);
    //     _reviewerSelectView.selectById(_observation.get('reviewer_user_id'));
    //   },
    //   error: function () {/* TODO :: Show modal dialog error message */}
    // });

    // load observers collection
    _observerSelectView.setCollection(_observerCollection);
    _observerSelectView.selectById(_observation.get('observer_user_id'));
    // load reviewers collection
    _reviewerSelectView.setCollection(_reviewerCollection);
    _reviewerSelectView.selectById(_observation.get('reviewer_user_id'));
  };

  _onDateChange = function () {
    try {
      _observation.set({
        begin: _validateDate(_date.value),
        begin_error: null
      });
    } catch (e) {
      _observation.set({begin_error: e.message});
    }
  };

   _onPierTempChange = function () {
    var pierTemperature;

    pierTemperature = _pierTemperature.value;

    pierTemperature = (pierTemperature === '' ?
        null : parseFloat(pierTemperature));

    _observation.set({
      pier_temperature: pierTemperature
    });
  };

  _validateDate = function (date) {
    var validDate = true,
        helpText = null;

    var parsedDate = Format.parseDate(date);

    if (parsedDate === null) {
      validDate = false;
      helpText = 'Entered value does not look like a date. Format: YYYY-MM-DD';
    } else if (!Validate.validDate(parsedDate)) {
      validDate = false;
      helpText = 'Invalid Date. Future dates are not valid.';
    }

    _updateErrorState(_date, validDate, helpText);

    if (!validDate) {
      throw new Error(helpText);
    }

    return parsedDate;
  };

  _updateErrorState = function (el, valid, helpText) {
    if (valid){
      // passes validation
      el.classList.remove('error');
      el.removeAttribute('title');
    } else {
      // does not pass validation
      el.classList.add('error');
      el.setAttribute('title', helpText);
    }
  };

  /**
   * Called when an observatory detail has been loaded.
   *
   * @param {[type]} observatory [description]
   */
  _setObservatory = function (observatory) {
    var azimuth = 0,
        correction = 0,
        mark,
        mark_id,
        marks,
        electronics_id,
        theodolite_id,
        // observatory information
        piers = observatory.get('piers'),
        default_pier_id = observatory.get('default_pier_id'),
        default_electronics_id = null,
        default_theodolite_id = null,
        electronics = observatory.getElectronics(),
        theodolites = observatory.getTheodolites(),
        // other locals
        pier = null;

    // update observatory id
    if (_observation.get('observatory_id') !== observatory.id) {
      // different observatory, clear related info
      _observation.set({
        observatory_id: observatory.id,
        mark_id: null,
        electronics_id: null,
        theodolite_id: null
      });
    }

    // read these after they were potentially reset
    mark_id = _observation.get('mark_id');
    electronics_id = _observation.get('electronics_id');
    theodolite_id = _observation.get('theodolite_id');

    // preserve existing selections
    if (mark_id !== null) {
      pier = observatory.getPierByMarkId(mark_id);
    } else if (default_pier_id !== null) {
      pier = piers.get(default_pier_id);
    }
    if (pier !== null) {
      piers.select(pier);
      default_electronics_id = pier.get('default_electronics_id');
      default_theodolite_id = pier.get('default_theodolite_id');

      correction = pier.get('correction');
      marks = pier.get('marks');
      mark = marks.get(mark_id);
      if (mark !== null) {
        azimuth = mark.get('azimuth');
      }
    }
    __select_by_id(electronics, electronics_id || default_electronics_id);
    __select_by_id(theodolites, theodolite_id || default_theodolite_id);

    _calculator.set({
      pierCorrection: correction,
      trueAzimuthOfMark: azimuth
    });
    // update views
    _electronicsSelectView.setCollection(electronics);
    _theodoliteSelectView.setCollection(theodolites);
    _pierSelectView.setCollection(piers);
  };


  _this.getJulianDay = function (date) {
    var y = date.getUTCFullYear(),
        m = date.getUTCMonth(),
        d = date.getUTCDate(),
        janOne = new Date(y,0,1),
        selectedDate = new Date(y,m,d);

    return Math.round((selectedDate - janOne) / 86400000) + 1;
  };

  _this.destroy = Util.compose(
      // sub class destroy method
      function () {
        // Remove event listeners
        _date.removeEventListener('change', _onDateChange);
        _pierTemperature.removeEventListener('change', _onPierTempChange);

        // Clean up private methods
        _createViewSkeleton = null;
        _getUsers = null;
        _onDateChange = null;
        _onPierTempChange = null;
        _setObservatory = null;
        _updateErrorState = null;
        _validateDate = null;

        // Clean up private variables
        _admin = null;
        _calculator = null;
        _date = null;
        _electronicsSelectView = null;
        _marksSelectView = null;
        _julianDay = null;
        _observation = null;
        _observatoryId = null;
        _observatorySelectView = null;
        _observatories = null;
        _observerSelect = null;
        _observerSelectView = null;
        _pierSelectView = null;
        _pierTemperature = null;
        _reviewerSelect = null;
        _reviewerSelectView = null;
        _theodoliteSelectView = null;
        _user = null;
        _userFactory = null;
      },
      // parent class destroy method
      _this.destroy);

  _this.render = function () {
    var begin = new Date(_observation.get('begin') || (new Date()).getTime()),
        begin_error = _observation.get('begin_error'),
        reviewed = _observation.get('reviewed'),
        user_admin = _user.get('admin');

    if (begin_error === null) {
      _date.value = Format.date(begin);
      _julianDay.value = _this.getJulianDay(begin);
    } else {
      _julianDay.value = '';
    }

    _pierTemperature.value = _observation.get('pier_temperature');

    // Disable the observer and reviewer select if non-admin user or
    //  finalized observation.
    if (user_admin === 'N' || reviewed === 'Y') {
      _observerSelect.setAttribute('disabled', 'disabled');
      _reviewerSelect.setAttribute('disabled', 'disabled');
    } else {
      _observerSelect.removeAttribute('disabled');
      _reviewerSelect.removeAttribute('disabled');
    }
  };


  _initialize(options);
  options = null;
  return _this;
};

module.exports = ObservationMetaView;
