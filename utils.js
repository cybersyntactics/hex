// Douglas Crockford
function object(o) {
    function F() {}
    F.prototype = o;
    return new F();
}

// http://stackoverflow.com/questions/201183/how-do-you-determine-equality-for-two-javascript-objects
function equal(obj1, obj2) {
    for (var i in obj1) {
        if (obj1.hasOwnProperty(i)) {
            if (!obj2.hasOwnProperty(i)) return false;
            if (obj1[i] != obj2[i]) return false;
        }
    }
    for (var i in obj2) {
        if (obj2.hasOwnProperty(i)) {
            if (!obj1.hasOwnProperty(i)) return false;
            if (obj1[i] != obj2[i]) return false;
        }
    }
    return true;
}

// http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically
// can probably add hasOwnProperty check. Or just use framework extend like underscore.js or jsquery.
function merge(obj1, obj2) {
  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if ( obj2[p].constructor==Object ) {
        obj1[p] = merge(obj1[p], obj2[p]);

      } else {
        obj1[p] = obj2[p];

      }

    } catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];

    }
  }

  return obj1;
}

// http://javascript.about.com/od/byexample/a/events-mousebutton-example.htm
function whichButton(e) {
  var e = e || window.event;
  var left, right, middle, b; 
  if (e.which) {
    left = (e.which == 1);    
    middle = (e.which == 2);
    right = (e.which == 3);
  } else if (e.button) { // for IE style button (1,4,2). Might need better browser detection.
    b = e.button;
    middle = Math.floor(b/4);
    b %= 4;
    right = Math.floor(b/2);
    left = b%2;
  }
  return {'left' : left, 'right': right, 'middle': middle};
};