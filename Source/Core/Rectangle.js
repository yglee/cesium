/*global define*/
define([
        './freezeObject',
        './defaultValue',
        './defined',
        './Ellipsoid',
        './Cartographic',
        './DeveloperError',
        './Math'
    ], function(
        freezeObject,
        defaultValue,
        defined,
        Ellipsoid,
        Cartographic,
        DeveloperError,
        CesiumMath) {
    "use strict";

    /**
     * A two dimensional region specified as longitude and latitude coordinates.
     *
     * @alias Rectangle
     * @constructor
     *
     * @param {Number} [west=0.0] The westernmost longitude, in radians, in the range [-Pi, Pi].
     * @param {Number} [south=0.0] The southernmost latitude, in radians, in the range [-Pi/2, Pi/2].
     * @param {Number} [east=0.0] The easternmost longitude, in radians, in the range [-Pi, Pi].
     * @param {Number} [north=0.0] The northernmost latitude, in radians, in the range [-Pi/2, Pi/2].
     */
    var Rectangle = function(west, south, east, north) {
        /**
         * The westernmost longitude in radians in the range [-Pi, Pi].
         *
         * @type {Number}
         * @default 0.0
         */
        this.west = defaultValue(west, 0.0);

        /**
         * The southernmost latitude in radians in the range [-Pi/2, Pi/2].
         *
         * @type {Number}
         * @default 0.0
         */
        this.south = defaultValue(south, 0.0);

        /**
         * The easternmost longitude in radians in the range [-Pi, Pi].
         *
         * @type {Number}
         * @default 0.0
         */
        this.east = defaultValue(east, 0.0);

        /**
         * The northernmost latitude in radians in the range [-Pi/2, Pi/2].
         *
         * @type {Number}
         * @default 0.0
         */
        this.north = defaultValue(north, 0.0);
    };

    /**
     * Creates an rectangle given the boundary longitude and latitude in degrees.
     *
     * @memberof Rectangle
     *
     * @param {Number} [west=0.0] The westernmost longitude in degrees in the range [-180.0, 180.0].
     * @param {Number} [south=0.0] The southernmost latitude in degrees in the range [-90.0, 90.0].
     * @param {Number} [east=0.0] The easternmost longitude in degrees in the range [-180.0, 180.0].
     * @param {Number} [north=0.0] The northernmost latitude in degrees in the range [-90.0, 90.0].
     * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
     *
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
     *
     * @example
     * var rectangle = Cesium.Rectangle.fromDegrees(0.0, 20.0, 10.0, 30.0);
     */
    Rectangle.fromDegrees = function(west, south, east, north, result) {
        west = CesiumMath.toRadians(defaultValue(west, 0.0));
        south = CesiumMath.toRadians(defaultValue(south, 0.0));
        east = CesiumMath.toRadians(defaultValue(east, 0.0));
        north = CesiumMath.toRadians(defaultValue(north, 0.0));

        if (!defined(result)) {
            return new Rectangle(west, south, east, north);
        }

        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;

        return result;
    };

    /**
     * Creates the smallest possible Rectangle that encloses all positions in the provided array.
     * @memberof Rectangle
     *
     * @param {Array} cartographics The list of Cartographic instances.
     * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
     */
    Rectangle.fromCartographicArray = function(cartographics, result) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(cartographics)) {
            throw new DeveloperError('cartographics is required.');
        }
        //>>includeEnd('debug');

        var minLon = Number.MAX_VALUE;
        var maxLon = -Number.MAX_VALUE;
        var minLat = Number.MAX_VALUE;
        var maxLat = -Number.MAX_VALUE;

        for ( var i = 0, len = cartographics.length; i < len; i++) {
            var position = cartographics[i];
            minLon = Math.min(minLon, position.longitude);
            maxLon = Math.max(maxLon, position.longitude);
            minLat = Math.min(minLat, position.latitude);
            maxLat = Math.max(maxLat, position.latitude);
        }

        if (!defined(result)) {
            return new Rectangle(minLon, minLat, maxLon, maxLat);
        }

        result.west = minLon;
        result.south = minLat;
        result.east = maxLon;
        result.north = maxLat;
        return result;
    };

    /**
     * Duplicates an Rectangle.
     *
     * @memberof Rectangle
     *
     * @param {Rectangle} rectangle The rectangle to clone.
     * @param {Rectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided. (Returns undefined if rectangle is undefined)
     */
    Rectangle.clone = function(rectangle, result) {
        if (!defined(rectangle)) {
            return undefined;
        }

        if (!defined(result)) {
            return new Rectangle(rectangle.west, rectangle.south, rectangle.east, rectangle.north);
        }

        result.west = rectangle.west;
        result.south = rectangle.south;
        result.east = rectangle.east;
        result.north = rectangle.north;
        return result;
    };

    /**
     * Duplicates this Rectangle.
     *
     * @memberof Rectangle
     *
     * @param {Rectangle} [result] The object onto which to store the result.
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
     */
    Rectangle.prototype.clone = function(result) {
        return Rectangle.clone(this, result);
    };

    /**
     * Compares the provided Rectangle with this Rectangle componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Rectangle
     *
     * @param {Rectangle} [other] The Rectangle to compare.
     * @returns {Boolean} <code>true</code> if the Rectangles are equal, <code>false</code> otherwise.
     */
    Rectangle.prototype.equals = function(other) {
        return Rectangle.equals(this, other);
    };

    /**
     * Compares the provided rectangles and returns <code>true</code> if they are equal,
     * <code>false</code> otherwise.
     *
     * @memberof Rectangle
     *
     * @param {Rectangle} [left] The first Rectangle.
     * @param {Rectangle} [right] The second Rectangle.
     *
     * @returns {Boolean} <code>true</code> if left and right are equal; otherwise <code>false</code>.
     */
    Rectangle.equals = function(left, right) {
        return (left === right) ||
               ((defined(left)) &&
                (defined(right)) &&
                (left.west === right.west) &&
                (left.south === right.south) &&
                (left.east === right.east) &&
                (left.north === right.north));
    };

    /**
     * Compares the provided Rectangle with this Rectangle componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Rectangle
     *
     * @param {Rectangle} [other] The Rectangle to compare.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @returns {Boolean} <code>true</code> if the Rectangles are within the provided epsilon, <code>false</code> otherwise.
     */
    Rectangle.prototype.equalsEpsilon = function(other, epsilon) {
        //>>includeStart('debug', pragmas.debug);
        if (typeof epsilon !== 'number') {
            throw new DeveloperError('epsilon is required and must be a number.');
        }
        //>>includeEnd('debug');

        return defined(other) &&
               (Math.abs(this.west - other.west) <= epsilon) &&
               (Math.abs(this.south - other.south) <= epsilon) &&
               (Math.abs(this.east - other.east) <= epsilon) &&
               (Math.abs(this.north - other.north) <= epsilon);
    };

    /**
     * Checks an Rectangle's properties and throws if they are not in valid ranges.
     *
     * @param {Rectangle} rectangle The rectangle to validate
     *
     * @exception {DeveloperError} <code>north</code> must be in the interval [<code>-Pi/2</code>, <code>Pi/2</code>].
     * @exception {DeveloperError} <code>south</code> must be in the interval [<code>-Pi/2</code>, <code>Pi/2</code>].
     * @exception {DeveloperError} <code>east</code> must be in the interval [<code>-Pi</code>, <code>Pi</code>].
     * @exception {DeveloperError} <code>west</code> must be in the interval [<code>-Pi</code>, <code>Pi</code>].
     */
    Rectangle.validate = function(rectangle) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(rectangle)) {
            throw new DeveloperError('rectangle is required');
        }

        var north = rectangle.north;
        if (typeof north !== 'number') {
            throw new DeveloperError('north is required to be a number.');
        }

        if (north < -CesiumMath.PI_OVER_TWO || north > CesiumMath.PI_OVER_TWO) {
            throw new DeveloperError('north must be in the interval [-Pi/2, Pi/2].');
        }

        var south = rectangle.south;
        if (typeof south !== 'number') {
            throw new DeveloperError('south is required to be a number.');
        }

        if (south < -CesiumMath.PI_OVER_TWO || south > CesiumMath.PI_OVER_TWO) {
            throw new DeveloperError('south must be in the interval [-Pi/2, Pi/2].');
        }

        var west = rectangle.west;
        if (typeof west !== 'number') {
            throw new DeveloperError('west is required to be a number.');
        }

        if (west < -Math.PI || west > Math.PI) {
            throw new DeveloperError('west must be in the interval [-Pi, Pi].');
        }

        var east = rectangle.east;
        if (typeof east !== 'number') {
            throw new DeveloperError('east is required to be a number.');
        }

        if (east < -Math.PI || east > Math.PI) {
            throw new DeveloperError('east must be in the interval [-Pi, Pi].');
        }
        //>>includeEnd('debug');
    };

    /**
     * Computes the southwest corner of an rectangle.
     * @memberof Rectangle
     *
     * @param {Rectangle} rectangle The rectangle for which to find the corner
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Rectangle.getSouthwest = function(rectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(rectangle)) {
            throw new DeveloperError('rectangle is required');
        }
        //>>includeEnd('debug');

        if (!defined(result)) {
            return new Cartographic(rectangle.west, rectangle.south);
        }
        result.longitude = rectangle.west;
        result.latitude = rectangle.south;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the northwest corner of an rectangle.
     * @memberof Rectangle
     *
     * @param {Rectangle} rectangle The rectangle for which to find the corner
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Rectangle.getNorthwest = function(rectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(rectangle)) {
            throw new DeveloperError('rectangle is required');
        }
        //>>includeEnd('debug');

        if (!defined(result)) {
            return new Cartographic(rectangle.west, rectangle.north);
        }
        result.longitude = rectangle.west;
        result.latitude = rectangle.north;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the northeast corner of an rectangle.
     * @memberof Rectangle
     *
     * @param {Rectangle} rectangle The rectangle for which to find the corner
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Rectangle.getNortheast = function(rectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(rectangle)) {
            throw new DeveloperError('rectangle is required');
        }
        //>>includeEnd('debug');

        if (!defined(result)) {
            return new Cartographic(rectangle.east, rectangle.north);
        }
        result.longitude = rectangle.east;
        result.latitude = rectangle.north;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the southeast corner of an rectangle.
     * @memberof Rectangle
     *
     * @param {Rectangle} rectangle The rectangle for which to find the corner
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Rectangle.getSoutheast = function(rectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(rectangle)) {
            throw new DeveloperError('rectangle is required');
        }
        //>>includeEnd('debug');

        if (!defined(result)) {
            return new Cartographic(rectangle.east, rectangle.south);
        }
        result.longitude = rectangle.east;
        result.latitude = rectangle.south;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the center of an rectangle.
     * @memberof Rectangle
     *
     * @param {Rectangle} rectangle The rectangle for which to find the center
     * @param {Cartographic} [result] The object onto which to store the result.
     * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Rectangle.getCenter = function(rectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(rectangle)) {
            throw new DeveloperError('rectangle is required');
        }
        //>>includeEnd('debug');

        if (!defined(result)) {
            return new Cartographic((rectangle.west + rectangle.east) * 0.5, (rectangle.south + rectangle.north) * 0.5);
        }
        result.longitude = (rectangle.west + rectangle.east) * 0.5;
        result.latitude = (rectangle.south + rectangle.north) * 0.5;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the intersection of two rectangles
     * @memberof Rectangle
     *
     * @param {Rectangle} rectangle On rectangle to find an intersection
     * @param otherRectangle Another rectangle to find an intersection
     * @param {Rectangle} [result] The object onto which to store the result.
     * @returns {Rectangle} The modified result parameter or a new Rectangle instance if none was provided.
     */
    Rectangle.intersectWith = function(rectangle, otherRectangle, result) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(rectangle)) {
            throw new DeveloperError('rectangle is required');
        }
        if (!defined(otherRectangle)) {
            throw new DeveloperError('otherRectangle is required.');
        }
        //>>includeEnd('debug');

        var west = Math.max(rectangle.west, otherRectangle.west);
        var south = Math.max(rectangle.south, otherRectangle.south);
        var east = Math.min(rectangle.east, otherRectangle.east);
        var north = Math.min(rectangle.north, otherRectangle.north);
        if (!defined(result)) {
            return new Rectangle(west, south, east, north);
        }
        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
    };

    /**
     * Returns true if the cartographic is on or inside the rectangle, false otherwise.
     * @memberof Rectangle
     *
     * @param {Rectangle} rectangle The rectangle
     * @param {Cartographic} cartographic The cartographic to test.
     * @returns {Boolean} true if the provided cartographic is inside the rectangle, false otherwise.
     */
    Rectangle.contains = function(rectangle, cartographic) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(rectangle)) {
            throw new DeveloperError('rectangle is required');
        }
        if (!defined(cartographic)) {
            throw new DeveloperError('cartographic is required.');
        }
        //>>includeEnd('debug');

        return cartographic.longitude >= rectangle.west &&
               cartographic.longitude <= rectangle.east &&
               cartographic.latitude >= rectangle.south &&
               cartographic.latitude <= rectangle.north;
    };

    /**
     * Determines if the rectangle is empty, i.e., if <code>west >= east</code>
     * or <code>south >= north</code>.
     *
     * @memberof Rectangle
     *
     * @param {Rectangle} rectangle The rectangle
     * @returns {Boolean} True if the rectangle is empty; otherwise, false.
     */
    Rectangle.isEmpty = function(rectangle) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(rectangle)) {
            throw new DeveloperError('rectangle is required');
        }
        //>>includeEnd('debug');

        return rectangle.west >= rectangle.east || rectangle.south >= rectangle.north;
    };

    var subsampleLlaScratch = new Cartographic();
    /**
     * Samples an rectangle so that it includes a list of Cartesian points suitable for passing to
     * {@link BoundingSphere#fromPoints}.  Sampling is necessary to account
     * for rectangles that cover the poles or cross the equator.
     *
     * @param {Rectangle} rectangle The rectangle to subsample.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid to use.
     * @param {Number} [surfaceHeight=0.0] The height of the rectangle above the ellipsoid.
     * @param {Array} [result] The array of Cartesians onto which to store the result.
     * @returns {Array} The modified result parameter or a new Array of Cartesians instances if none was provided.
     */
    Rectangle.subsample = function(rectangle, ellipsoid, surfaceHeight, result) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(rectangle)) {
            throw new DeveloperError('rectangle is required');
        }
        //>>includeEnd('debug');

        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        surfaceHeight = defaultValue(surfaceHeight, 0.0);

        if (!defined(result)) {
            result = [];
        }
        var length = 0;

        var north = rectangle.north;
        var south = rectangle.south;
        var east = rectangle.east;
        var west = rectangle.west;

        var lla = subsampleLlaScratch;
        lla.height = surfaceHeight;

        lla.longitude = west;
        lla.latitude = north;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;

        lla.longitude = east;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;

        lla.latitude = south;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;

        lla.longitude = west;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;

        if (north < 0.0) {
            lla.latitude = north;
        } else if (south > 0.0) {
            lla.latitude = south;
        } else {
            lla.latitude = 0.0;
        }

        for ( var i = 1; i < 8; ++i) {
            var temp = -Math.PI + i * CesiumMath.PI_OVER_TWO;
            if (west < temp && temp < east) {
                lla.longitude = temp;
                result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
                length++;
            }
        }

        if (lla.latitude === 0.0) {
            lla.longitude = west;
            result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
            length++;
            lla.longitude = east;
            result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
            length++;
        }
        result.length = length;
        return result;
    };

    /**
     * The largest possible rectangle.
     * @memberof Rectangle
     * @type Rectangle
    */
    Rectangle.MAX_VALUE = freezeObject(new Rectangle(-Math.PI, -CesiumMath.PI_OVER_TWO, Math.PI, CesiumMath.PI_OVER_TWO));

    return Rectangle;
});
