class Application {
  constructor(name, props, detected) {
    this.name            = name;
    this.props           = props;
    this.confidence      = {};
    this.confidenceTotal = 0;
    this.detected        = Boolean(detected);
    this.excludes        = [];
    this.version         = '';
    this.versions        = [];
  }

  /**
   * Calculate confidence total
   */
  getConfidence() {
    var total = 0;

    for ( var id in this.confidence ) {
      total += this.confidence[id];
    }

    return this.confidenceTotal = Math.min(total, 100);
  }

  setDetected(pattern, type, value, key) {
    this.detected = true;

    // Set confidence level
    this.confidence[type + ' ' + ( key ? key + ' ' : '' ) + pattern.regex] = pattern.confidence || 100;

    // Detect version number
    if ( pattern.version ) {
      var version = pattern.version;
      var matches = pattern.regex.exec(value);

      if ( matches ) {
        matches.forEach((match, i) => {
          // Parse ternary operator
          var ternary = new RegExp('\\\\' + i + '\\?([^:]+):(.*)$').exec(version);

          if ( ternary && ternary.length === 3 ) {
            version = version.replace(ternary[0], match ? ternary[1] : ternary[2]);
          }

          // Replace back references
          version = version.replace(new RegExp('\\\\' + i, 'g'), match || '');
        });

        if ( version && this.versions.indexOf(version) === -1 ) {
          this.versions.push(version);
        }

        if ( this.versions.length ) {
          // Use the longest detected version number
          this.version = this.versions.reduce((a, b) => a.length > b.length ? a : b)[0];
        }
      }
    }
  }
}

export default Application
