/*global define*/
define([
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        '../Core/Color',
        '../Core/Cartesian2',
        '../Core/Cartesian3',
        '../Core/Cartesian4',
        '../Core/NearFarScalar',
        '../Core/Matrix4',
        './HorizontalOrigin',
        './VerticalOrigin',
        './SceneMode',
        './SceneTransforms'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        Color,
        Cartesian2,
        Cartesian3,
        Cartesian4,
        NearFarScalar,
        Matrix4,
        HorizontalOrigin,
        VerticalOrigin,
        SceneMode,
        SceneTransforms) {
    "use strict";

    /**
     * A viewport-aligned image positioned in the 3D scene, that is created
     * and rendered using a {@link BillboardCollection}.  A billboard is created and its initial
     * properties are set by calling {@link BillboardCollection#add}.
     * <br /><br />
     * <div align='center'>
     * <img src='images/Billboard.png' width='400' height='300' /><br />
     * Example billboards
     * </div>
     *
     * @alias Billboard
     *
     * @performance Reading a property, e.g., {@link Billboard#show}, is constant time.
     * Assigning to a property is constant time but results in
     * CPU to GPU traffic when {@link BillboardCollection#update} is called.  The per-billboard traffic is
     * the same regardless of how many properties were updated.  If most billboards in a collection need to be
     * updated, it may be more efficient to clear the collection with {@link BillboardCollection#removeAll}
     * and add new billboards instead of modifying each one.
     *
     * @exception {DeveloperError} scaleByDistance.far must be greater than scaleByDistance.near
     * @exception {DeveloperError} translucencyByDistance.far must be greater than translucencyByDistance.near
     * @exception {DeveloperError} pixelOffsetScaleByDistance.far must be greater than pixelOffsetScaleByDistance.near
     *
     * @see BillboardCollection
     * @see BillboardCollection#add
     * @see Label
     *
     * @internalConstructor
     *
     * @demo <a href="http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Billboards.html">Cesium Sandcastle Billboard Demo</a>
     */
    var Billboard = function(options, billboardCollection) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        //>>includeStart('debug', pragmas.debug);
        if (defined(options.scaleByDistance) && options.scaleByDistance.far <= options.scaleByDistance.near) {
            throw new DeveloperError('scaleByDistance.far must be greater than scaleByDistance.near.');
        }
        if (defined(options.translucencyByDistance) &&
                options.translucencyByDistance.far <= options.translucencyByDistance.near) {
            throw new DeveloperError('translucencyByDistance.far must be greater than translucencyByDistance.near.');
        }
        if (defined(options.pixelOffsetScaleByDistance) &&
                options.pixelOffsetScaleByDistance.far <= options.pixelOffsetScaleByDistance.near) {
            throw new DeveloperError('pixelOffsetScaleByDistance.far must be greater than pixelOffsetScaleByDistance.near.');
        }
        //>>includeEnd('debug');

        this._show = defaultValue(options.show, true);
        this._position = Cartesian3.clone(defaultValue(options.position, Cartesian3.ZERO));
        this._actualPosition = Cartesian3.clone(this._position); // For columbus view and 2D
        this._pixelOffset = Cartesian2.clone(defaultValue(options.pixelOffset, Cartesian2.ZERO));
        this._translate = new Cartesian2(0.0, 0.0); // used by labels for glyph vertex translation
        this._eyeOffset = Cartesian3.clone(defaultValue(options.eyeOffset, Cartesian3.ZERO));
        this._verticalOrigin = defaultValue(options.verticalOrigin, VerticalOrigin.CENTER);
        this._horizontalOrigin = defaultValue(options.horizontalOrigin, HorizontalOrigin.CENTER);
        this._scale = defaultValue(options.scale, 1.0);
        this._imageIndex = defaultValue(options.imageIndex, -1);
        this._color = Color.clone(defaultValue(options.color, Color.WHITE));
        this._rotation = defaultValue(options.rotation, 0.0);
        this._alignedAxis = Cartesian3.clone(defaultValue(options.alignedAxis, Cartesian3.ZERO));
        this._width = options.width;
        this._height = options.height;
        this._scaleByDistance = options.scaleByDistance;
        this._translucencyByDistance = options.translucencyByDistance;
        this._pixelOffsetScaleByDistance = options.pixelOffsetScaleByDistance;
        this._id = options.id;
        this._collection = defaultValue(options.collection, billboardCollection);

        this._pickId = undefined;
        this._pickPrimitive = defaultValue(options._pickPrimitive, this);
        this._billboardCollection = billboardCollection;
        this._dirty = false;
        this._index = -1; //Used only by BillboardCollection
    };

    var SHOW_INDEX = Billboard.SHOW_INDEX = 0;
    var POSITION_INDEX = Billboard.POSITION_INDEX = 1;
    var PIXEL_OFFSET_INDEX = Billboard.PIXEL_OFFSET_INDEX = 2;
    var EYE_OFFSET_INDEX = Billboard.EYE_OFFSET_INDEX = 3;
    var HORIZONTAL_ORIGIN_INDEX = Billboard.HORIZONTAL_ORIGIN_INDEX = 4;
    var VERTICAL_ORIGIN_INDEX = Billboard.VERTICAL_ORIGIN_INDEX = 5;
    var SCALE_INDEX = Billboard.SCALE_INDEX = 6;
    var IMAGE_INDEX_INDEX = Billboard.IMAGE_INDEX_INDEX = 7;
    var COLOR_INDEX = Billboard.COLOR_INDEX = 8;
    var ROTATION_INDEX = Billboard.ROTATION_INDEX = 9;
    var ALIGNED_AXIS_INDEX = Billboard.ALIGNED_AXIS_INDEX = 10;
    var SCALE_BY_DISTANCE_INDEX = Billboard.SCALE_BY_DISTANCE_INDEX = 11;
    var TRANSLUCENCY_BY_DISTANCE_INDEX = Billboard.TRANSLUCENCY_BY_DISTANCE_INDEX = 12;
    var PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX = Billboard.PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX = 13;
    Billboard.NUMBER_OF_PROPERTIES = 14;

    function makeDirty(billboard, propertyChanged) {
        var billboardCollection = billboard._billboardCollection;
        if (defined(billboardCollection)) {
            billboardCollection._updateBillboard(billboard, propertyChanged);
            billboard._dirty = true;
        }
    }

    defineProperties(Billboard.prototype, {
        /**
         * Determines if this billboard will be shown.  Use this to hide or show a billboard, instead
         * of removing it and re-adding it to the collection.
         * @memberof Billboard.prototype
         * @type {Boolean}
         */
        show: {
            get: function() {
                return this._show;
            },
            set: function(value) {
                //>>includeStart('debug', pragmas.debug);
                if (!defined(value)) {
                    throw new DeveloperError('value is required.');
                }
                //>>includeEnd('debug');

                if (value !== this._show) {
                    this._show = value;
                    makeDirty(this, SHOW_INDEX);
                }
            }
        },

        /**
        * Gets and sets the Cartesian position of this billboard.
        * @memberof Billboard.prototype
        * @type {Cartesian3}
        */
        position: {
            get: function() {
                return this._position;
            },
            set: function(value) {
                //>>includeStart('debug', pragmas.debug)
                if (!defined(value)) {
                    throw new DeveloperError('value is required.');
                }
                //>>includeEnd('debug');

                var position = this._position;
                if (!Cartesian3.equals(position, value)) {
                    Cartesian3.clone(value, position);
                    Cartesian3.clone(value, this._actualPosition);

                    makeDirty(this, POSITION_INDEX);
                }
            }
        },

        /**
         * Gets and sets the pixel offset in screen space from the origin of this billboard.  This is commonly used
         * to align multiple billboards and labels at the same position, e.g., an image and text.  The
         * screen space origin is the bottom, left corner of the canvas; <code>x</code> increases from
         * left to right, and <code>y</code> increases from bottom to top.
         * <br /><br />
         * <div align='center'>
         * <table border='0' cellpadding='5'><tr>
         * <td align='center'><code>default</code><br/><img src='images/Billboard.setPixelOffset.default.png' width='250' height='188' /></td>
         * <td align='center'><code>b.pixeloffset = new Cartesian2(50, -25);</code><br/><img src='images/Billboard.setPixelOffset.x50y-25.png' width='250' height='188' /></td>
         * </tr></table>
         * The billboard's origin is indicated by the yellow point.
         * </div>
         * @memberof Billboard.prototype
         * @type {Cartesian2}
         */
        pixelOffset: {
            get: function() {
                return this._pixelOffset;
            },
            set: function(value) {
                //>>includeStart('debug', pragmas.debug);
                if (!defined(value)) {
                    throw new DeveloperError('value is required.');
                }
                //>>includeEnd('debug');

                var pixelOffset = this._pixelOffset;
                if (!Cartesian2.equals(pixelOffset, value)) {
                    Cartesian2.clone(value, pixelOffset);
                    makeDirty(this, PIXEL_OFFSET_INDEX);
                }
            }
        },

        /**
         * Gets and sets near and far scaling properties of a Billboard based on the billboard's distance from the camera.
         * A billboard's scale will interpolate between the {@link NearFarScalar#nearValue} and
         * {@link NearFarScalar#farValue} while the camera distance falls within the upper and lower bounds
         * of the specified {@link NearFarScalar#near} and {@link NearFarScalar#far}.
         * Outside of these ranges the billboard's scale remains clamped to the nearest bound.  If undefined,
         * scaleByDistance will be disabled.
         * @memberof Billboard.prototype
         * @type {NearFarScalar}
         * @example
         * // Example 1.
         * // Set a billboard's scaleByDistance to scale by 1.5 when the
         * // camera is 1500 meters from the billboard and disappear as
         * // the camera distance approaches 8.0e6 meters.
         * b.scaleByDistance = new Cesium.NearFarScalar(1.5e2, 1.5, 8.0e6, 0.0);
         *
         * // Example 2.
         * // disable scaling by distance
         * b.scaleByDistance = undefined;
         */
        scaleByDistance: {
            get: function() {
                return this._scaleByDistance;
            },
            set: function(scale) {
                if (NearFarScalar.equals(this._scaleByDistance, scale)) {
                    return;
                }

                //>>includeStart('debug', pragmas.debug);
                if (scale.far <= scale.near) {
                    throw new DeveloperError('far distance must be greater than near distance.');
                }
                //>>includeEnd('debug');

                makeDirty(this, SCALE_BY_DISTANCE_INDEX);
                this._scaleByDistance = NearFarScalar.clone(scale, this._scaleByDistance);
            }
        },

        /**
         * Gets and sets near and far translucency properties of a Billboard based on the billboard's distance from the camera.
         * A billboard's translucency will interpolate between the {@link NearFarScalar#nearValue} and
         * {@link NearFarScalar#farValue} while the camera distance falls within the upper and lower bounds
         * of the specified {@link NearFarScalar#near} and {@link NearFarScalar#far}.
         * Outside of these ranges the billboard's translucency remains clamped to the nearest bound.  If undefined,
         * translucencyByDistance will be disabled.
         * @memberof Billboard.prototype
         * @type {NearFarScalar}
         * @example
         * // Example 1.
         * // Set a billboard's translucency to 1.0 when the
         * // camera is 1500 meters from the billboard and disappear as
         * // the camera distance approaches 8.0e6 meters.
         * b.translucencyByDistance = new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.0);
         *
         * // Example 2.
         * // disable translucency by distance
         * b.translucencyByDistance = undefined;
         */
        translucencyByDistance: {
            get: function() {
                return this._translucencyByDistance;
            },
            set: function(translucency) {
                if (NearFarScalar.equals(this._translucencyByDistance, translucency)) {
                    return;
                }

                //>>includeStart('debug', pragmas.debug);
                if (translucency.far <= translucency.near) {
                    throw new DeveloperError('far distance must be greater than near distance.');
                }
                //>>includeEnd('debug');

                makeDirty(this, TRANSLUCENCY_BY_DISTANCE_INDEX);
                this._translucencyByDistance = NearFarScalar.clone(translucency, this._translucencyByDistance);
            }
        },

        /**
         * Gets and sets near and far pixel offset scaling properties of a Billboard based on the billboard's distance from the camera.
         * A billboard's pixel offset will be scaled between the {@link NearFarScalar#nearValue} and
         * {@link NearFarScalar#farValue} while the camera distance falls within the upper and lower bounds
         * of the specified {@link NearFarScalar#near} and {@link NearFarScalar#far}.
         * Outside of these ranges the billboard's pixel offset scale remains clamped to the nearest bound.  If undefined,
         * pixelOffsetScaleByDistance will be disabled.
         * @memberof Billboard.prototype
         * @type {NearFarScalar}
         * @example
         * // Example 1.
         * // Set a billboard's pixel offset scale to 0.0 when the
         * // camera is 1500 meters from the billboard and scale pixel offset to 10.0 pixels
         * // in the y direction the camera distance approaches 8.0e6 meters.
         * b.pixelOffset = new Cesium.Cartesian2(0.0, 1.0);
         * b.pixelOffsetScaleByDistance = new Cesium.NearFarScalar(1.5e2, 0.0, 8.0e6, 10.0);
         *
         * // Example 2.
         * // disable pixel offset by distance
         * b.pixelOffsetScaleByDistance = undefined;
         */
        pixelOffsetScaleByDistance: {
            get: function() {
                return this._pixelOffsetScaleByDistance;
            },
            set: function(pixelOffsetScale) {
                if (NearFarScalar.equals(this._pixelOffsetScaleByDistance, pixelOffsetScale)) {
                    return;
                }

                //>>includeStart('debug', pragmas.debug);
                if (pixelOffsetScale.far <= pixelOffsetScale.near) {
                    throw new DeveloperError('far distance must be greater than near distance.');
                }
                //>>includeEnd('debug');

                makeDirty(this, PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX);
                this._pixelOffsetScaleByDistance = NearFarScalar.clone(pixelOffsetScale, this._pixelOffsetScaleByDistance);
            }
        },

        /**
         * Gets and sets the 3D Cartesian offset applied to this billboard in eye coordinates.  Eye coordinates is a left-handed
         * coordinate system, where <code>x</code> points towards the viewer's right, <code>y</code> points up, and
         * <code>z</code> points into the screen.  Eye coordinates use the same scale as world and model coordinates,
         * which is typically meters.
         * <br /><br />
         * An eye offset is commonly used to arrange multiple billboards or objects at the same position, e.g., to
         * arrange a billboard above its corresponding 3D model.
         * <br /><br />
         * Below, the billboard is positioned at the center of the Earth but an eye offset makes it always
         * appear on top of the Earth regardless of the viewer's or Earth's orientation.
         * <br /><br />
         * <div align='center'>
         * <table border='0' cellpadding='5'><tr>
         * <td align='center'><img src='images/Billboard.setEyeOffset.one.png' width='250' height='188' /></td>
         * <td align='center'><img src='images/Billboard.setEyeOffset.two.png' width='250' height='188' /></td>
         * </tr></table>
         * <code>b.eyeOffset = new Cartesian3(0.0, 8000000.0, 0.0);</code><br /><br />
         * </div>
         * @memberof Billboard.prototype
         * @type {Cartesian3}
         */
        eyeOffset: {
            get: function() {
                return this._eyeOffset;
            },
            set: function(value) {
                //>>includeStart('debug', pragmas.debug);
                if (!defined(value)) {
                    throw new DeveloperError('value is required.');
                }
                //>>includeEnd('debug');

                var eyeOffset = this._eyeOffset;
                if (!Cartesian3.equals(eyeOffset, value)) {
                    Cartesian3.clone(value, eyeOffset);
                    makeDirty(this, EYE_OFFSET_INDEX);
                }
            }
        },

        /**
         * Gets and sets the horizontal origin of this billboard, which determines if the billboard is
         * to the left, center, or right of its position.
         * <br /><br />
         * <div align='center'>
         * <img src='images/Billboard.setHorizontalOrigin.png' width='400' height='300' /><br />
         * </div>
         * @memberof Billboard.prototype
         * @type {HorizontalOrigin} value The horizontal origin.
         * @example
         * // Use a bottom, left origin
         * b.horizontalOrigin = Cesium.HorizontalOrigin.LEFT;
         * b.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
         */
        horizontalOrigin: {
            get: function() {
                return this._horizontalOrigin;
            },
            set: function(value) {
                //>>includeStart('debug', pragmas.debug);
                if (!defined(value)) {
                    throw new DeveloperError('value is required.');
                }
                //>>includeEnd('debug');

                if (this._horizontalOrigin !== value) {
                    this._horizontalOrigin = value;
                    makeDirty(this, HORIZONTAL_ORIGIN_INDEX);
                }
            }
        },

        /**
         * Gets and sets the vertical origin of this billboard, which determines if the billboard is
         * to the above, below, or at the center of its position.
         * <br /><br />
         * <div align='center'>
         * <img src='images/Billboard.setVerticalOrigin.png' width='400' height='300' /><br />
         * </div>
         * @memberof Billboard.prototype
         * @type {VerticalOrigin}
         * @example
         * // Use a bottom, left origin
         * b.hHorizontalOrigin = Cesium.HorizontalOrigin.LEFT;
         * b.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
         */
        verticalOrigin : {
            get: function() {
                return this._verticalOrigin;
            },
            set: function(value) {
                //>>includeStart('debug', pragmas.debug);
                if (!defined(value)) {
                    throw new DeveloperError('value is required.');
                }
                //>>includeEnd('debug');

                if (this._verticalOrigin !== value) {
                    this._verticalOrigin = value;
                    makeDirty(this, VERTICAL_ORIGIN_INDEX);
                }
            }
        },

        /**
         * Gets and sets the uniform scale that is multiplied with the billboard's image size in pixels.
         * A scale of <code>1.0</code> does not change the size of the billboard; a scale greater than
         * <code>1.0</code> enlarges the billboard; a positive scale less than <code>1.0</code> shrinks
         * the billboard.
         * <br /><br />
         * <div align='center'>
         * <img src='images/Billboard.setScale.png' width='400' height='300' /><br/>
         * From left to right in the above image, the scales are <code>0.5</code>, <code>1.0</code>,
         * and <code>2.0</code>.
         * </div>
         * @memberof Billboard.prototype
         * @type {Number}
         */
        scale: {
            get: function() {
                return this._scale;
            },
            set: function(value) {
                //>>includeStart('debug', pragmas.debug);
                if (!defined(value)) {
                    throw new DeveloperError('value is required.');
                }
                //>>includeEnd('debug');

                if (this._scale !== value) {
                    this._scale = value;
                    makeDirty(this, SCALE_INDEX);
                }
            }
        },

        /**
         * Gets and sets the image index
         * @memberof Billboard.prototype
         * @type {Number}
         */
        imageIndex: {
            get: function(){
                return this._imageIndex;
            },
            set: function(value) {
                //>>includeStart('debug', pragmas.debug);
                if (typeof value !== 'number') {
                    throw new DeveloperError('value is required and must be a number.');
                }
                //>>includeEnd('debug');

                if (this._imageIndex !== value) {
                    this._imageIndex = value;
                    makeDirty(this, IMAGE_INDEX_INDEX);
                }
            }
        },


        /**
         * Gets and sets the color that is multiplied with the billboard's texture.  This has two common use cases.  First,
         * the same white texture may be used by many different billboards, each with a different color, to create
         * colored billboards.  Second, the color's alpha component can be used to make the billboard translucent as shown below.
         * An alpha of <code>0.0</code> makes the billboard transparent, and <code>1.0</code> makes the billboard opaque.
         * <br /><br />
         * <div align='center'>
         * <table border='0' cellpadding='5'><tr>
         * <td align='center'><code>default</code><br/><img src='images/Billboard.setColor.Alpha255.png' width='250' height='188' /></td>
         * <td align='center'><code>alpha : 0.5</code><br/><img src='images/Billboard.setColor.Alpha127.png' width='250' height='188' /></td>
         * </tr></table>
         * </div>
         * <br />
         * The red, green, blue, and alpha values are indicated by <code>value</code>'s <code>red</code>, <code>green</code>,
         * <code>blue</code>, and <code>alpha</code> properties as shown in Example 1.  These components range from <code>0.0</code>
         * (no intensity) to <code>1.0</code> (full intensity).
         * @memberof Billboard.prototype
         * @param {Color}
         * @example
         * // Example 1. Assign yellow.
         * b.color = Cesium.Color.YELLOW;
         *
         * // Example 2. Make a billboard 50% translucent.
         * b.color = new Cesium.Color(1.0, 1.0, 1.0, 0.5);
         */
        color: {
            get: function() {
                return this._color;
            },
            set: function(value) {
                //>>includeStart('debug', pragmas.debug);
                if (!defined(value)) {
                    throw new DeveloperError('value is required.');
                }
                //>>includeEnd('debug');

                var color = this._color;
                if (!Color.equals(color, value)) {
                    Color.clone(value, color);
                    makeDirty(this, COLOR_INDEX);
                }
            }
        },

        /**
         * Gets and sets the rotation angle in radians.
         * @memberof Billboard.prototype
         * @type {Number}
         */
        rotation: {
            get: function() {
                return this._rotation;
            },
            set: function(value) {
                //>>includeStart('debug', pragmas.debug);
                if (!defined(value)) {
                    throw new DeveloperError('value is required.');
                }
                //>>includeEnd('debug');

                if (this._rotation !== value) {
                    this._rotation = value;
                    makeDirty(this, ROTATION_INDEX);
                }
            }
        },

        /**
         * Gets and sets the aligned axis in world space. The aligned axis is the unit vector that the billboard up vector points towards.
         * The default is the zero vector, which means the billboard is aligned to the screen up vector.
         * @memberof Billboard.prototype
         * @type {Cartesian3} value The aligned axis.
         * @example
         * // Example 1.
         * // Have the billboard up vector point north
         * billboard.alignedAxis = Cesium.Cartesian3.UNIT_Z;
         *
         * // Example 2.
         * // Have the billboard point east.
         * billboard.alignedAxis = Cartesian3.UNIT_Z;
         * billboard.rotation = -Cesium.Math.PI_OVER_TWO;
         *
         * // Example 3.
         * // Reset the aligned axis
         * billboard.alignedAxis = Cesium.Cartesian3.ZERO;
         */
        alignedAxis: {
            get: function() {
                return this._alignedAxis;
            },
            set: function(value) {
                //>>includeStart('debug', pragmas.debug);
                if (!defined(value)) {
                    throw new DeveloperError('value is required.');
                }
                //>>includeEnd('debug');

                var axis = this._alignedAxis;
                if (!Cartesian3.equals(axis, value)) {
                    Cartesian3.clone(value, axis);
                    makeDirty(this, ALIGNED_AXIS_INDEX);
                }
            }
        },

        /**
         * Gets and sets a width for the billboard. If undefined, the image width will be used.
         * @memberof Billboard.prototype
         * @type {Number}
         */
        width: {
            get: function() {
                return this._width;
            },
            set: function(value) {
                if (this._width !== value) {
                    this._width = value;
                    makeDirty(this, IMAGE_INDEX_INDEX);
                }
            }
        },

        /**
         * Gets and sets a height for the billboard. If undefined, the image height will be used.
         * @memberof Billboard.prototype
         * @type {Number}
         */
        height: {
            get: function() {
                return this._height;
            },
            set: function(value) {
                if (this._height !== value) {
                    this._height = value;
                    makeDirty(this, IMAGE_INDEX_INDEX);
                }
            }
        },

        /**
         * Gets or sets the user-defined object returned when the billboard is picked.
         * @memberof Billboard.prototype
         * @type {Object}
         */
        id : {
            get : function() {
                return this._id;
            },
            set : function(value) {
                this._id = value;
                if (defined(this._pickId)) {
                    this._pickId.object.id = value;
                }
            }
        },

        /**
         * The primitive to return when picking this billboard.
         * @private
         */
        pickPrimitive : {
            get : function() {
                return this._pickPrimitive;
            },
            set : function(value) {
                this._pickPrimitive = value;
                if (defined(this._pickId)) {
                    this._pickId.object.primitive = value;
                }
            }
        }
    });

    Billboard.prototype.getPickId = function(context) {
        if (!defined(this._pickId)) {
            this._pickId = context.createPickId({
                primitive : this._pickPrimitive,
                collection : this._collection,
                id : this._id
            });
        }

        return this._pickId;
    };

    Billboard.prototype._setTranslate = function(value) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }
        //>>includeEnd('debug');

        var translate = this._translate;
        if (!Cartesian2.equals(translate, value)) {
            Cartesian2.clone(value, translate);
            makeDirty(this, PIXEL_OFFSET_INDEX);
        }
    };

    Billboard.prototype._getActualPosition = function() {
        return this._actualPosition;
    };

    Billboard.prototype._setActualPosition = function(value) {
        Cartesian3.clone(value, this._actualPosition);
        makeDirty(this, POSITION_INDEX);
    };


    var tempCartesian3 = new Cartesian4();
    Billboard._computeActualPosition = function(position, frameState, modelMatrix) {
        if (frameState.mode === SceneMode.SCENE3D) {
            return position;
        }

        Matrix4.multiplyByPoint(modelMatrix, position, tempCartesian3);
        return SceneTransforms.computeActualWgs84Position(frameState, tempCartesian3);
    };

    var scracthMatrix4 = new Matrix4();
    var scratchCartesian4 = new Cartesian4();
    var scrachEyeOffset = new Cartesian3();
    var scratchCartesian2 = new Cartesian2();
    Billboard._computeScreenSpacePosition = function(modelMatrix, position, eyeOffset, pixelOffset, scene) {
        // This function is basically a stripped-down JavaScript version of BillboardCollectionVS.glsl
        var camera = scene.frameState.camera;
        var view = camera.viewMatrix;
        var projection = camera.frustum.projectionMatrix;

        // Model to eye coordinates
        var mv = Matrix4.multiplyTransformation(view, modelMatrix, scracthMatrix4);
        var positionEC = Matrix4.multiplyByVector(mv, Cartesian4.fromElements(position.x, position.y, position.z, 1, scratchCartesian4), scratchCartesian4);

        // Apply eye offset, e.g., czm_eyeOffset
        var zEyeOffset = Cartesian3.multiplyComponents(eyeOffset, Cartesian3.normalize(positionEC, scrachEyeOffset), scrachEyeOffset);
        positionEC.x += eyeOffset.x + zEyeOffset.x;
        positionEC.y += eyeOffset.y + zEyeOffset.y;
        positionEC.z += zEyeOffset.z;

        var positionCC = Matrix4.multiplyByVector(projection, positionEC, scratchCartesian4); // clip coordinates
        var positionWC = SceneTransforms.clipToWindowCoordinates(scene, positionCC, new Cartesian2());

        // Apply pixel offset
        var po = Cartesian2.multiplyByScalar(pixelOffset, scene._context.uniformState.highResolutionSnapScale, scratchCartesian2);
        positionWC.x += po.x;
        positionWC.y += po.y;

        return positionWC;
    };

    /**
     * Computes the screen-space position of the billboard's origin, taking into account eye and pixel offsets.
     * The screen space origin is the bottom, left corner of the canvas; <code>x</code> increases from
     * left to right, and <code>y</code> increases from bottom to top.
     *
     * @memberof Billboard
     *
     * @param {Scene} scene The scene.
     *
     * @returns {Cartesian2} The screen-space position of the billboard.
     *
     * @exception {DeveloperError} Billboard must be in a collection.
     *
     * @see Billboard#eyeOffset
     * @see Billboard#pixelOffset
     *
     * @example
     * console.log(b.computeScreenSpacePosition(scene).toString());
     */
    var tempPixelOffset = new Cartesian2(0.0, 0.0);
    Billboard.prototype.computeScreenSpacePosition = function(scene) {
        var billboardCollection = this._billboardCollection;

        //>>includeStart('debug', pragmas.debug);
        if (!defined(billboardCollection)) {
            throw new DeveloperError('Billboard must be in a collection.  Was it removed?');
        }
        if (!defined(scene)) {
            throw new DeveloperError('scene is required.');
        }
        //>>includeEnd('debug');

        // pixel offset for screenspace computation is the pixelOffset + screenspace translate
        Cartesian2.clone(this._pixelOffset, tempPixelOffset);
        Cartesian2.add(tempPixelOffset, this._translate, tempPixelOffset);

        var modelMatrix = billboardCollection.modelMatrix;
        return Billboard._computeScreenSpacePosition(modelMatrix, this._actualPosition, this._eyeOffset, tempPixelOffset, scene);
    };

    /**
     * Determines if this billboard equals another billboard.  Billboards are equal if all their properties
     * are equal.  Billboards in different collections can be equal.
     *
     * @memberof Billboard
     *
     * @param {Billboard} other The billboard to compare for equality.
     *
     * @returns {Boolean} <code>true</code> if the billboards are equal; otherwise, <code>false</code>.
     */
    Billboard.prototype.equals = function(other) {
        return this === other ||
               defined(other) &&
               this._show === other._show &&
               this._imageIndex === other._imageIndex &&
               this._scale === other._scale &&
               this._verticalOrigin === other._verticalOrigin &&
               this._horizontalOrigin === other._horizontalOrigin &&
               Cartesian3.equals(this._position, other._position) &&
               Color.equals(this._color, other._color) &&
               Cartesian2.equals(this._pixelOffset, other._pixelOffset) &&
               Cartesian2.equals(this._translate, other._translate) &&
               Cartesian3.equals(this._eyeOffset, other._eyeOffset) &&
               NearFarScalar.equals(this._scaleByDistance, other._scaleByDistance) &&
               NearFarScalar.equals(this._translucencyByDistance, other._translucencyByDistance) &&
               NearFarScalar.equals(this._pixelOffsetScaleByDistance, other._pixelOffsetScaleByDistance) &&
               this._id === other._id;
    };

    Billboard.prototype._destroy = function() {
        this._pickId = this._pickId && this._pickId.destroy();
        this._billboardCollection = undefined;
    };

    return Billboard;
});
