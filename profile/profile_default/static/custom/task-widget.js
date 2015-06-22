/**
 * Define the IPython GenePattern Task widget
 */
require(["widgets/js/widget", "jqueryui"], function (/* WidgetManager */) {

    /**
     * Widget for file input into a GenePattern Notebook.
     * Used for file inputs by the runTask widget.
     *
     * Supported Features:
     *      External URLs
     *      Uploading New Files
     *      Pasted Internal File Paths
     *      Pasted Job Result URLs
     *
     * Non-Supported Features:
     *      GenomeSpace Files
     *      GenePattern Uploaded Files
     */
    $.widget("gp.fileInput", {
        options: {
            allowFilePaths: true,
            allowExternalUrls: true,
            allowJobUploads: true,

            // Pointers to associated runTask widget
            runTask: null,
            param: null
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            // Save pointers to associated Run Task widget or parameter
            this._setPointers();

            // Set variables
            var widget = this;
            this._value = null;
            this._display = null;

            // Add data pointer
            this.element.data("widget", this);

            // Add classes and child elements
            this.element.addClass("file-widget");
            this.element.append(
                $("<div></div>")
                    .addClass("file-widget-upload")
                    .append(
                        $("<button></button>")
                            .addClass("btn btn-default file-widget-upload-file")
                            .text("Upload File...")
                            .click(function () {
                                $(this).parents(".file-widget").find(".file-widget-input-file").click();
                            })
                    )
                    .append(
                        $("<input />")
                            .addClass("file-widget-input-file")
                            .attr("type", "file")
                            .change(function () {
                                var newValue = widget.element.find(".file-widget-input-file")[0].files[0];
                                widget.value(newValue);
                            })
                    )
                    .append(
                        $("<button></button>")
                            .addClass("file-widget-url")
                            .addClass("btn btn-default file-widget-button")
                            .text("Add Path or URL...")
                            .click(function() {
                                widget._pathBox(true);
                                widget.element.find(".file-widget-path-input").focus();
                            })
                    )
                    .append(
                        $("<span></span>")
                            .addClass("file-widget-drop")
                            .text("Drag Files Here")
                    )
                    .append(
                        $("<div></div>")
                            .addClass("file-widget-size")
                            .text(" 2GB file upload limit using the Upload File... button.")
                    )
            );
            this.element.append(
                $("<div></div>")
                    .addClass("file-widget-listing")
                    .css("display", "none")
                    .append(
                        $("<div></div>")
                            .addClass("file-widget-value")
                            .append(
                                $("<div></div>")
                                    .addClass("btn btn-default btn-sm file-widget-value-erase")
                                    .append(
                                        $("<span></span>")
                                            .addClass("fa fa-times")

                                    )
                                    .click(function() {
                                        widget._updateSlider("destroy");
                                        widget.clear();
                                    })
                            )
                            .append(
                                $("<span></span>")
                                    .addClass("file-widget-value-text")
                            )
                    )
            );
            this.element.append(
                $("<div></div>")
                    .addClass("form-group file-widget-path")
                    .css("display", "none")
                    .append(
                        $("<div></div>")
                            .addClass("control-label file-widget-path-label")
                            .text("Enter Path or URL")
                    )
                    .append(
                        $("<input />")
                            .addClass("form-control file-widget-path-input")
                            .attr("type", "text")
                    )
                    .append(
                        $("<div></div>")
                            .addClass("file-widget-path-buttons")
                            .append(
                                $("<button></button>")
                                    .addClass("btn btn-default file-widget-button")
                                    .text("Select")
                                    .click(function() {
                                        var boxValue = widget.element.find(".file-widget-path-input").val();
                                        widget.element.find(".file-widget-path-input").val("");
                                        widget._pathBox(false);
                                        widget.value(boxValue);
                                    })
                            )
                            .append(" ")
                            .append(
                                $("<button></button>")
                                    .addClass("btn btn-default file-widget-button")
                                    .text("Cancel")
                                    .click(function() {
                                        widget._pathBox(false);
                                        widget.element.find(".file-widget-path-input").val("");
                                    })
                            )
                    )
            );

            // Initialize the drag & drop functionality
            if (this.options.allowJobUploads) {
                this._initDragDrop();
            }

            // Hide elements if not in use by options
            this._setDisplayOptions();
        },

        /**
         * Destructor
         *
         * @private
         */
        _destroy: function() {
            this._updateSlider("destroy");
            this.element.removeClass("file-widget");
            this.element.empty();
        },

        /**
         * Update the left-hand slider with data information
         *
         * @private
         */
        _updateSlider: function(method) {
            if (method.toLowerCase() == "destroy") {
                GenePattern.notebook.removeSliderData(this._display);
            }
            // Else assume "update"
            else {
                GenePattern.notebook.updateSliderData(this._display, this._value);
            }
        },

        /**
         * Initializes the drag & drop functionality in the widget
         *
         * @private
         */
        _initDragDrop: function() {
            var widget = this;
            var dropTarget = this.element[0];

            dropTarget.addEventListener("dragenter", function(event) {
                widget.element.css("background-color", "#dfeffc");
                event.stopPropagation();
                event.preventDefault();
            }, false);
            dropTarget.addEventListener("dragexit", function(event) {
                widget.element.css("background-color", "");
                event.stopPropagation();
                event.preventDefault();
            }, false);
            dropTarget.addEventListener("dragover", function(event) {
                event.stopPropagation();
                event.preventDefault();
            }, false);
            dropTarget.addEventListener("drop", function(event) {
                // If there is are files assume this is a file drop
                if (event['dataTransfer'].files.length > 0) {
                    var files = event['dataTransfer'].files;
                    widget.value(files[0]);
                }
                // If not, assume this is a text drop
                else {
                    var html = event['dataTransfer'].getData('text/html');
                    var htmlList = $(html);

                    // Path for Firefox
                    if (htmlList.length === 1) {
                        var tag = $(htmlList).prop("tagName");
                        if (tag.toLowerCase() !== "a") {
                            htmlList = $(htmlList).find("a");
                        }
                        var text = $(htmlList).attr("href");
                        if (text !== undefined && text !== null) {
                            widget.value(text);
                        }
                    }

                    // Path for Chrome
                    else if (htmlList.length > 1) {
                        $.each(htmlList, function(i, e) {
                            var text = $(e).attr("href");
                            if (text !== undefined && text !== null) {
                                widget.value(text);
                            }
                        });
                    }
                }

                widget.element.css("background-color", "");

                event.stopPropagation();
                event.preventDefault();
            }, false);
        },

        /**
         * Shows or hides the box of selected files
         *
         * @param file - A string if to show, undefined or null if to hide
         * @private
         */
        _fileBox: function(file) {
            if (file) {
                this.element.find(".file-widget-value-text").text(file);
                this.element.find(".file-widget-listing").show();
                this.element.find(".file-widget-upload").hide();
            }
            else {
                this.element.find(".file-widget-upload").show();
                this.element.find(".file-widget-listing").hide();
            }
        },

        /**
         * Takes a value and returns the display string for the value
         *
         * @param value - the value, either a string or File object
         * @returns {string} - the display value
         * @private
         */
        _valueToDisplay: function(value) {
            if (typeof value === 'string') {
                return value;
            }
            else {
                return value.name;
            }
        },

        /**
         * Displays the select path or URL box
         *
         * @param showPathBox - Whether to display or hide the path box
         * @private
         */
        _pathBox: function(showPathBox) {
            if (showPathBox) {
                this.element.find(".file-widget-path").show();
                this.element.find(".file-widget-upload").hide();
            }
            else {
                this.element.find(".file-widget-path").hide();
                this.element.find(".file-widget-upload").show();
            }
        },

        /**
         * Update the pointers to the Run Task widget and parameter
         *
         * @private
         */
        _setPointers: function() {
            if (this.options.runTask) { this._runTask = this.options.runTask; }
            if (this.options.param) { this._param = this.options.param; }
        },

        /**
         * Update the display of the UI to match current options
         *
         * @private
         */
        _setDisplayOptions: function() {
            if (!this.options.allowJobUploads) {
                this.element.find(".file-widget-upload-file").hide();
                this.element.find(".file-widget-drop").hide();
                this.element.find(".file-widget-size").hide();
            }
            else {
                this.element.find(".file-widget-upload-file").show();
                this.element.find(".file-widget-drop").show();
                this.element.find(".file-widget-size").show();
            }
            if (!this.options.allowExternalUrls && !this.options.allowFilePaths) {
                this.element.find(".file-widget-url").hide();
            }
            else if (!this.options.allowExternalUrls && this.options.allowFilePaths) {
                this.element.find(".file-widget-url").show();
                this.element.find(".file-widget-url").text("Add Path...");
                this.element.find(".file-widget-path-label").text("Enter Path");
            }
            else if (this.options.allowExternalUrls && !this.options.allowFilePaths) {
                this.element.find(".file-widget-url").show();
                this.element.find(".file-widget-url").text("Add URL...");
                this.element.find(".file-widget-path-label").text("Enter URL");
            }
            else if (this.options.allowExternalUrls && this.options.allowFilePaths) {
                this.element.find(".file-widget-url").show();
                this.element.find(".file-widget-url").text("Add Path or URL...");
                this.element.find(".file-widget-path-label").text("Enter Path or URL");
            }
        },

        /**
         * Update all options
         *
         * @param options - Object contain options to update
         * @private
         */
        _setOptions: function(options) {
            this._superApply(arguments);
            this._setPointers();
            this._setDisplayOptions();
        },

        /**
         * Update individual option
         *
         * @param key - The name of the option
         * @param value - The new value of the option
         * @private
         */
        _setOption: function(key, value) {
            this._super(key, value);
            this._setPointers();
            this._setDisplayOptions();
        },

        /**
         * Upload the selected file to the server
         *
         * @param pObj - Object containing the following params:
         *                  success: Callback for success, expects url to file
         *                  error: Callback on error, expects exception
         * @returns {boolean} - Whether an upload was just initiated or not
         */
        upload: function(pObj) {
            var currentlyUploading = null;
            var widget = this;

            // Value is a File object
            if (typeof this.value() === 'object' && this.value()) {
                GenePattern.upload({
                    file: this.value(),
                    success: function(response, url) {
                        widget._value = url;
                        if (pObj.success) {
                            pObj.success(response, url);
                        }
                    },
                    error: function(exception) {
                        console.log("Error uploading file from file input widget: " + exception.statusText);
                        if (pObj.error) {
                            pObj.error(exception);
                        }
                    }
                });
                currentlyUploading = true;
            }
            // If the value is not set, give an error
            else if (!this.value()) {
                console.log("Cannot upload from file input: value is null.");
                currentlyUploading = false;
                if (pObj.error) {
                    pObj.error({statusText: "Cannot upload from file input: value is null."});
                }
            }
            // If the value is a string, do nothing
            else {
                // Else assume we have a non-upload value selected
                currentlyUploading = false;
            }
            return currentlyUploading;
        },

        /**
         * Getter for associated RunTask object
         *
         * @returns {object|null}
         */
        runTask: function() {
            return this._runTask;
        },

        /**
         * Getter for associated parameter
         * @returns {string|null|object}
         */
        param: function() {
            return this._param;
        },

        /**
         * Gets or sets the value of this widget
         *
         * @param [val=optional] - String value for file (undefined is getter)
         * @returns {object|string|null} - The value of this widget
         */
        value: function(val) {
            // Do setter
            if (val) {
                this._value = val;
                this._display = this._valueToDisplay(val);
                this._fileBox(this._display);
                this._updateSlider("update");
            }
            // Do getter
            else {
                return this._value;
            }
        },

        /**
         * Clears the current value of the widget and hides file box
         * @private
         */
        clear: function() {
            this._value = null;
            this._fileBox(null);
        }
    });


    /**
     * Widget for text input into a GenePattern Notebook.
     * Used for text, number and password inputs by the runTask widget.
     *
     * Supported Features:
     *      Text input
     *      Password input
     *      Number input
     *
     * Non-Supported Features:
     *      Directory input
     */
    $.widget("gp.textInput", {
        options: {
            type: "text", // Accepts: text, number, password
            default: "",

            // Pointers to associated runTask widget
            runTask: null,
            param: null
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            // Save pointers to associated Run Task widget or parameter
            this._setPointers();

            // Set variables
            var widget = this;
            //noinspection JSValidateTypes
            this._value = this.options.default;

            // Clean the type option
            this._cleanType();

            // Add data pointer
            this.element.data("widget", this);

            // Add classes and child elements
            this.element.addClass("text-widget");
            this.element.append(
                $("<input />")
                    .addClass("form-control text-widget-input")
                    .attr("type", this.options.type)
                    .val(this._value)
                    .change(function() {
                        widget._value = $(this).val();
                    })
            );

            // Hide elements if not in use by options
            this._setDisplayOptions();
        },

        /**
         * Destructor
         *
         * @private
         */
        _destroy: function() {
            this.element.removeClass("text-widget");
            this.element.empty();
        },

        /**
         * Update all options
         *
         * @param options - Object contain options to update
         * @private
         */
        _setOptions: function(options) {
            this._superApply(arguments);
            this._setPointers();
            this._setDisplayOptions();
        },

        /**
         * Update for single options
         *
         * @param key - The name of the option
         * @param value - The new value of the option
         * @private
         */
        _setOption: function(key, value) {
            this._super(key, value);
            this._setPointers();
            this._setDisplayOptions();
        },

        /**
         * Update the pointers to the Run Task widget and parameter
         *
         * @private
         */
        _setPointers: function() {
            if (this.options.runTask) { this._runTask = this.options.runTask; }
            if (this.options.param) { this._param = this.options.param; }
        },

        /**
         * Update the display of the UI to match current options
         *
         * @private
         */
        _setDisplayOptions: function() {
            this._cleanType();
            this.element.find(".text-widget-input").prop("type", this.options.type);
        },

        /**
         * Removes bad type listings, defaulting to text
         *
         * @private
         */
        _cleanType: function() {
            if (typeof this.options.type !== 'string') {
                console.log("Type option for text input is not a string, defaulting to text");
                this.options.type = "text";
            }
            if (this.options.type.toLowerCase() !== "text" &&
                this.options.type.toLowerCase() !== "password" &&
                this.options.type.toLowerCase() !== "number") {
                console.log("Type option for text input is not 'text', 'password' or 'number', defaulting to text");
                this.options.type = "text";
            }
        },

        /**
         * Gets or sets the value of the input
         *
         * @param val - the value for the setter
         * @returns {_value|string}
         */
        value: function(val) {
            // Do setter
            if (val) {
                this._value = val;
                this.element.find(".text-widget-input").val(val);
            }
            // Do getter
            else {
                return this._value;
            }
        }
    });


    /**
     * Widget for choice input into a GenePattern Notebook.
     * Used for choice inputs by the runTask widget.
     *
     * Supported Features:
     *      Simple Choice Input
     *
     * Non-Supported Features:
     *      File choice input
     *      Dynamic choice parameters
     */
    $.widget("gp.choiceInput", {
        options: {
            choices: [], // Assumes an object of key, value pairs
            default: null,

            // Pointers to associated runTask widget
            runTask: null,
            param: null
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            // Save pointers to associated Run Task widget or parameter
            this._setPointers();

            // Set variables
            var widget = this;

            // Add data pointer
            this.element.data("widget", this);

            // Add classes and child elements
            this.element.addClass("choice-widget");
            this.element.append(
                $("<select></select>")
                    .addClass("form-control choice-widget-select")
                    .change(function() {
                        widget._value = $(this).val();
                    })
            );

            // Hide elements if not in use by options
            this._setDisplayOptions();
        },

        /**
         * Destructor
         *
         * @private
         */
        _destroy: function() {
            this.element.removeClass("choice-widget");
            this.element.empty();
        },

        /**
         * Update all options
         *
         * @param options - Object contain options to update
         * @private
         */
        _setOptions: function(options) {
            this._superApply(arguments);
            this._setPointers();
            this._setDisplayOptions();
        },

        /**
         * Update for single options
         *
         * @param key - The name of the option
         * @param value - The new value of the option
         * @private
         */
        _setOption: function(key, value) {
            this._super(key, value);
            this._setPointers();
            this._setDisplayOptions();
        },

        /**
         * Update the pointers to the Run Task widget and parameter
         *
         * @private
         */
        _setPointers: function() {
            if (this.options.runTask) { this._runTask = this.options.runTask; }
            if (this.options.param) { this._param = this.options.param; }
        },

        /**
         * Update the display of the UI to match current options
         *
         * @private
         */
        _setDisplayOptions: function() {
            this._applyChoices();
            this._applyDefault();
        },

        /**
         * Applies the choices options, setting them to the provided values
         *
         * @private
         */
        _applyChoices: function() {
            if (typeof this.options.choices !== 'object') {
                console.log("Error reading choices in Choice Input, aborting");
                return;
            }

            var select = this.element.find(".choice-widget-select");
            select.empty();

            for (var key in this.options.choices) {
                if (this.options.choices.hasOwnProperty(key)) {
                    var value = this.options.choices[key];

                    select.append(
                        $("<option></option>")
                            .text(key)
                            .val(value)
                    );
                }
            }
        },

        /**
         * Applies the option for default, resetting the selected option
         *
         * @private
         */
        _applyDefault: function() {
            this.element.find(".choice-widget-select").val(this.options.default);
            this._value = this.element.find(".choice-widget-select").val();
        },

        /**
         * Gets or sets the value of the input
         *
         * @param val - the value for the setter
         * @returns {_value|string}
         */
        value: function(val) {
            // Do setter
            if (val) {
                this._value = val;
                this.element.find(".choice-widget-select").val(val);
            }
            // Do getter
            else {
                return this._value;
            }
        }
    });


    /**
     * Widget for entering parameters and launching a job from a task.
     *
     * Supported Features:
     *      File Inputs
     *      Text Inputs
     *      Choice Inputs
     *
     * Non-Supported Features:
     *      Batch Parameters
     *      EULA support
     *      Dynamic Dropdowns
     *      Reloaded Jobs
     *      File Lists
     *      Task Source
     */
    $.widget("gp.runTask", {
        options: {
            lsid: null,
            name: null
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            // Set variables
            var widget = this;
            var identifier = this._getIdentifier();

            // Add data pointer
            this.element.data("widget", this);

            // Add classes and scaffolding
            this.element.addClass("panel panel-default gp-widget gp-widget-task");
            this.element.append( // Attach header
                $("<div></div>")
                    .addClass("panel-heading gp-widget-task-header")
                    .append(
                        $("<div></div>")
                            .addClass("widget-float-right")
                            .append(
                                $("<span></span>")
                                    .addClass("gp-widget-task-version")
                            )
                            .append(
                                $("<button></button>")
                                    .addClass("btn btn-default btn-sm gp-widget-task-doc")
                                    .css("padding", "2px 7px")
                                    .attr("title", "View Documentation")
                                    .attr("data-toggle", "tooltip")
                                    .attr("data-placement", "bottom")
                                    .append(
                                        $("<span></span>")
                                            .addClass("fa fa-question")
                                    )
                                    .tooltip()
                                    .click(function(event) {
                                        var url = $(event.target).attr("data-href");
                                        window.open(url,'_blank');
                                    })
                            )
                            .append(" ")
                            .append(
                                $("<button></button>")
                                    .addClass("btn btn-default btn-sm")
                                    .css("padding", "2px 7px")
                                    .attr("title", "Toggle Code View")
                                    .attr("data-toggle", "tooltip")
                                    .attr("data-placement", "bottom")
                                    .append(
                                        $("<span></span>")
                                            .addClass("fa fa-terminal")
                                    )
                                    .tooltip()
                                    .click(function() {
                                        widget.toggleCode();
                                    })
                            )
                    )
                    .append(
                        $("<h3></h3>")
                            .addClass("panel-title")
                            .append(
                                $("<span></span>")
                                    .addClass("glyphicon glyphicon-th")
                            )
                            .append(
                                $("<span></span>")
                                    .addClass("gp-widget-task-name")
                            )
                    )
            );
            this.element.append( // Attach header
                $("<div></div>")
                    .addClass("panel-body")
                    .css("position", "relative")
                    .append(
                        $("<div></div>")
                            .addClass("widget-code gp-widget-task-code")
                            .css("display", "none")
                    )
                    .append( // Attach message box
                        $("<div></div>")
                            .addClass("alert gp-widget-task-message")
                            .css("display", "none")
                    )
                    .append( // Attach subheader
                        $("<div></div>")
                            .addClass("gp-widget-task-subheader")
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-task-desc")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-task-run")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-primary gp-widget-task-run-button")
                                            .text("Run")
                                            .click(function() {
                                                if (widget.validate()) {
                                                    widget.submit();
                                                }
                                            })
                                    )
                                    .append("* Required Field")
                            )
                    )
                    .append(
                        $("<div></div>") // Attach form placeholder
                            .addClass("form-horizontal gp-widget-task-form")
                    )
                    .append( // Attach footer
                        $("<div></div>")
                            .addClass("gp-widget-task-footer")
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-task-run")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-primary gp-widget-task-run-button")
                                            .text("Run")
                                            .click(function() {
                                                if (widget.validate()) {
                                                    widget.submit();
                                                }
                                            })
                                    )
                                    .append("* Required Field")
                            )
                    )
                    .append(
                        $("<div></div>")
                            .addClass("gp-widget-logged-in gp-widget-task-eula")
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-loading")
                                    .append("<img src='/static/custom/loader.gif' />")
                                    .hide()
                            )
                            .append(
                                $("<div></div>")
                                    .text("You must agree below to the following End-User license agreements before you can run this task.")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-task-eula-box")
                            )
                            .append(
                                $("<div></div>")
                                    .text("Do you accept the license agreements?")
                            )
                            .append(
                                $("<div></div>")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-primary btn-lg gp-widget-task-eula-accept")
                                            .text("Accept")
                                            .click(function() {
                                                var url = $(this).data("url");
                                                var lsid = $(this).data("lsid");

                                                // Hide the info and show loading icon
                                                widget.element.find(".gp-widget-task-eula").find("div").hide();
                                                widget.element.find(".gp-widget-loading").show();

                                                $.ajax({
                                                    url: url + "?lsid=" + encodeURIComponent(lsid),
                                                    type: 'GET',
                                                    xhrFields: {
                                                        withCredentials: true
                                                    },
                                                    success: function() {
                                                        widget.element.find(".gp-widget-task-eula").hide();
                                                    },
                                                    error: function(xhr, error) {
                                                        // widget.element.find(".gp-widget-task-eula").hide();
                                                        widget.errorMessage(error);
                                                    }
                                                });
                                            })
                                    )
                            )
                            .hide()
                    )
            );

            // Check to see if the user is authenticated yet
            if (GenePattern.authenticated) {
                // Make call to build the header & form
                this._task = this._loadTask(identifier);

                setTimeout(function() {
                    if (widget._task !== null) {
                        widget._buildHeader();
                        widget._buildForm();
                    }
                    else {
                        widget._showUninstalledMessage();
                    }
                }, 1);
            }
            else {
                this._showAuthenticationMessage();
                this._pollForAuth();
            }
        },

        /**
         * Destructor
         *
         * @private
         */
        _destroy: function() {
            this.element.removeClass("gp-widget-task");
            this.element.empty();
        },

        /**
         * Update all options
         *
         * @param options - Object contain options to update
         * @private
         */
        _setOptions: function(options) {
            this._superApply(arguments);
            var identifier = this._getIdentifier();
            this._task = this._loadTask(identifier);
            if (this._task !== null) {
                this._buildHeader();
                this._buildForm();
            }
            else {
                this._showUninstalledMessage();
            }
        },

        /**
         * Update for single options
         *
         * @param key - The name of the option
         * @param value - The new value of the option
         * @private
         */
        _setOption: function(key, value) {
            this._super(key, value);
        },

        /**
         * Returns an identifier for attaining the Task object from the server
         *
         * @returns {string|null}
         * @private
         */
        _getIdentifier: function() {
            if (this.options.lsid) { return this.options.lsid; }
            else if (this.options.name) { return this.options.name }
            else {
                throw "Error creating Run Task widget! No LSID or name!";
            }
        },

        /**
         * Returns the Task object based on the identifier
         *
         * @param identifier - String containing name or LSID
         * @returns {GenePattern.Task|null}
         * @private
         */
        _loadTask: function(identifier) {
            return GenePattern.task(identifier);
        },

        /**
         * Display module not installed message
         *
         * @private
         */
        _showUninstalledMessage: function() {
            this.element.find(".gp-widget-task-name").empty().text(" GenePattern Task: Module Not Installed");
            this.element.find(".gp-widget-task-form").empty().text("The module used by this widget is not installed on this GenePattern server.");
            this.element.find(".gp-widget-task-subheader").hide();
            this.element.find(".gp-widget-task-footer").hide();
        },

        /**
         * Display the not authenticated message
         *
         * @private
         */
        _showAuthenticationMessage: function() {
            this.element.find(".gp-widget-task-name").empty().text(" GenePattern Task: Not Authenticated");
            this.element.find(".gp-widget-task-form").empty()
                .addClass("alert alert-danger")
                .text("You must be authenticated before the task information can be displayed. After you authenticate it may take a few seconds for the task information to appear.");
            this.element.find(".gp-widget-task-subheader").hide();
            this.element.find(".gp-widget-task-footer").hide();

            // Update the doc button
            this.element.find(".gp-widget-task-doc").attr("disabled", "disabled");
        },

        /**
         * Polls every few seconds to see if the notebook is authenticated, and gets task info once authenticated
         *
         * @private
         */
        _pollForAuth: function() {
            var widget = this;
            setTimeout(function() {
                // Check to see if the user is authenticated yet
                if (GenePattern.authenticated) {
                    // If authenticated, execute cell again
                    widget.element.closest(".cell").data("cell").execute();
                }
                else {
                    // If not authenticated, poll again
                    widget._pollForAuth();
                }
            }, 1000);
        },

        /**
         * Build the EULA pane and display if necessary
         *
         * @private
         */
        _buildEula: function() {
            var eula = this._task.eula();   // Get the EULAs
            // Only build the EULA display if necessary
            if (eula !== undefined && eula !== null && eula['pendingEulas'] !== undefined && eula['pendingEulas'].length > 0) {
                var box = this.element.find(".gp-widget-task-eula-box");

                // Attach each of the EULAs
                for (var i = 0; i < eula['pendingEulas'].length; i++) {
                    var license = eula['pendingEulas'][i];
                    var licenseBox = $("<pre></pre>")
                        .addClass("gp-widget-task-eula-license")
                        .text(license['content']);
                    box.append(licenseBox);
                }

                // Attach the callback info to the accept button
                var accept = this.element.find(".gp-widget-task-eula-accept");
                accept.data("lsid", eula.acceptData.lsid);
                accept.data("url", eula.acceptUrl);

                this.element.find(".gp-widget-task-eula").show();
            }
        },

        /**
         * Build the header and return the Task object
         *
         * @private
         */
        _buildHeader: function() {
            this.element.find(".gp-widget-task-subheader").show();
            this.element.find(".gp-widget-task-footer").show();

            this.element.find(".gp-widget-task-name").empty().text(" " + this._task.name());
            this.element.find(".gp-widget-task-version").empty().text("Version " + this._task.version());
            this.element.find(".gp-widget-task-doc").attr("data-href", GenePattern.server() + this._task.documentation().substring(3));
            this.element.find(".gp-widget-task-desc").empty().text(this._task.description());
        },

        /**
         * Parse the code for the job spec and return the values of the inputs in a dictionary
         *
         * @private
         */
        _parseJobSpec: function() {
            var dict = {};
            var code = this.element.closest(".cell").data("cell").code_mirror.getValue();
            var lines = code.split("\n");

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];

                // Here is a line to parse
                if (line.indexOf(".set_parameter") !== -1) {
                    var parts = line.split(",");
                    var first = parts[0].split("\"");
                    var second = parts[1].split("\"");
                    var key = first[1];
                    dict[key] = second[1];
                }
            }

            return dict;
        },

        /**
         * Make the call to the server to get the params and build the form
         *
         * @private
         */
        _buildForm: function() {
            var widget = this;
            this.element.find(".gp-widget-task-form").empty();

            this._task.params({
                success: function(response, params) {
                    var reloadVals = widget._parseJobSpec();

                    for (var i = 0; i < params.length; i++) {
                        try {
                            var param = params[i];
                            var pDiv = widget._addParam(param);

                            if (reloadVals[param.name()] !== undefined) {
                                var pWidget = pDiv.data("widget");
                                pWidget.value(reloadVals[param.name()]);
                            }
                        }
                        catch(exception) {
                            console.log(exception);
                        }
                    }

                    // Build the EULA, too
                    widget._buildEula();
                },
                error: function(exception) {
                    widget.errorMessage("Could not load task: " + exception.statusText);
                }
            });
        },

        /**
         * Toggle the code view on or off
         */
        toggleCode: function() {
            var code = this.element.find(".gp-widget-task-code");
            var form = this.element.find(".gp-widget-task-form");
            var headers = this.element.find(".gp-widget-task-subheader, .gp-widget-task-footer");
            var eula = this.element.find(".gp-widget-task-eula");

            if (code.is(":hidden")) {
                this.element.closest(".cell").data("cell").code_mirror.refresh();
                var raw = this.element.closest(".cell").find(".input").html();
                code.html(raw);

                // Fix the issue where the code couldn't be selected
                code.find(".CodeMirror-scroll").attr("draggable", "false");

                form.slideUp();
                headers.slideUp();
                eula.slideUp();
                code.slideDown();
            }
            else {
                form.slideDown();

                // Only show the EULA if there is one to display
                if (this._task && this._task.eula() && this._task.eula().pendingEulas && this._task.eula().pendingEulas.length > 0) {
                    eula.slideDown();
                }

                // Only show these bits if authenticated
                if (GenePattern.authenticated) {
                    headers.slideDown();
                }

                code.slideUp();
            }
        },

        /**
         * Add the parameter to the form and return the widget
         *
         * @param param {GenePattern.Param}
         * @private
         */
        _addParam: function(param) {
            var form = this.element.find(".gp-widget-task-form");
            var required = param.optional() ? "" : "*";

            var paramBox = $("<div></div>")
                .addClass(" form-group gp-widget-task-param")
                .attr("name", param.name())
                .append(
                    $("<label></label>")
                        .addClass("col-sm-3 control-label gp-widget-task-param-name")
                        .text(param.name() + required)
                )
                .append(
                    $("<div></div>")
                        .addClass("col-sm-9 gp-widget-task-param-wrapper")
                        .append(
                            $("<div></div>")
                                .addClass("gp-widget-task-param-input")
                        )
                        .append(
                            $("<div></div>")
                                .addClass("gp-widget-task-param-desc")
                                .text(param.description())
                        )
                );
            if (required) paramBox.addClass("gp-widget-task-required");

            // Add the correct input widget
            if (param.type() === "java.io.File") {
                paramBox.find(".gp-widget-task-param-input").fileInput({
                    runTask: this,
                    param: param
                });
            }
            else if (param.choices()) {
                paramBox.find(".gp-widget-task-param-input").choiceInput({
                    runTask: this,
                    param: param,
                    choices: param.choices(),
                    default: param.defaultValue()
                });
            }
            else if (param.type() === "java.lang.String") {
                paramBox.find(".gp-widget-task-param-input").textInput({
                    runTask: this,
                    param: param,
                    default: param.defaultValue()
                });
            }
            else if (param.type() === "java.lang.Integer" || param.type() === "java.lang.Float") {
                paramBox.find(".gp-widget-task-param-input").textInput({
                    runTask: this,
                    param: param,
                    default: param.defaultValue(),
                    type: "number"
                });
            }
            else {
                console.log("Unknown input type for Run Task widget");
            }

            form.append(paramBox);
            return paramBox.find(".gp-widget-task-param-input");
        },

        /**
         * From the input widget's element get the input widget's value
         *
         * @param inputDiv - The element that has been made into the widget
         * @returns {*}
         * @private
         */
        _getInputValue: function(inputDiv) {
            if ($(inputDiv).hasClass("file-widget")) {
                return $(inputDiv).fileInput("value");
            }
            else if ($(inputDiv).hasClass("text-widget")) {
                return $(inputDiv).textInput("value");
            }
            else if ($(inputDiv).hasClass("choice-widget")) {
                return $(inputDiv).choiceInput("value");
            }
            else {
                console.log("Unknown input widget type.");
                return null;
            }
        },

        /**
         * Show a success message to the user
         *
         * @param message - String containing the message to show
         */
        successMessage: function(message) {
            var messageBox = this.element.find(".gp-widget-task-message");
            messageBox.removeClass("alert-danger");
            messageBox.addClass("alert-success");
            messageBox.text(message);
            messageBox.show("shake", {}, 500);
        },

        /**
         * Show an error message to the user
         *
         * @param message - String containing the message to show
         */
        errorMessage: function(message) {
            var messageBox = this.element.find(".gp-widget-task-message");
            messageBox.removeClass("alert-success");
            messageBox.addClass("alert-danger");
            messageBox.text(message);
            messageBox.show("shake", {}, 500);
        },

        /**
         * Validate the current Run Task form
         */
        validate: function() {
            var validated = true;
            var missing = [];
            var params = this.element.find(".gp-widget-task-param");

            // Validate each required parameter
            for (var i = 0; i < params.length; i++) {
                var param = $(params[i]);
                var required = param.hasClass("gp-widget-task-required");
                if (required) {
                    var input = param.find(".gp-widget-task-param-input");
                    var value = this._getInputValue(input);
                    if (value === null || value === "") {
                        param.addClass("gp-widget-task-param-missing");
                        missing.push(param.attr("name"));
                        validated = false;
                    }
                    else {
                        param.removeClass("gp-widget-task-param-missing");
                    }
                }
            }

            // Display message to user
            if (validated) {
                //this.successMessage("All required parameters present.");
            }
            else {
                this.errorMessage("Missing required parameters: " + missing.join(", "));
            }

            return validated;
        },

        /**
         * Submit the Run Task form to the server
         */
        submit: function() {
            // Create the job input
            var jobInput = this._task.jobInput();
            var widget = this;

            this.uploadAll({
                success: function() {
                    // Assign values from the inputs to the job input
                    var uiParams = widget.element.find(".gp-widget-task-param");
                    for (var i = 0; i < uiParams.length; i++) {
                        var uiParam = $(uiParams[i]);
                        var uiInput = uiParam.find(".gp-widget-task-param-input");
                        var uiValue = widget._getInputValue(uiInput);

                        if (uiValue !== null) {
                            var objParam = jobInput.params()[i];
                            objParam.values([uiValue]);
                        }
                    }

                    // Submit the job input
                    jobInput.submit({
                        success: function(response, jobNumber) {
                            //widget.successMessage("Job successfully submitted! Job ID: " + jobNumber);

                            // Set the code for the job widget
                            var cell = widget.element.closest(".cell").data("cell");
                            var code = GenePattern.notebook.buildJobCode(jobNumber);
                            cell.code_mirror.setValue(code);

                            // Execute cell.
                            cell.execute();
                        },
                        error: function(exception) {
                            widget.errorMessage("Error submitting job: " + exception.statusText);
                        }
                    });
                },
                error: function(exception) {
                    widget.errorMessage("Error uploading in preparation of job submission: " + exception.statusText);
                }
            });
        },

        /**
         * Upload all the file inputs that still need uploading
         *
         * @param pObj - Object containing the following params:
         *                  success: Callback for success, expects no arguments
         *                  error: Callback on error, expects exception
         * @returns {boolean} - Whether an upload was just initiated or not
         */
        uploadAll: function(pObj) {
            var files = this.element.find(".file-widget");
            var widget = this;

            // Cycle through all files
            for (var i = 0; i < files.length; i++) {
                var fileWidget = $(files[i]);
                var value = fileWidget.fileInput("value");

                // If one needs to be uploaded, upload, recheck
                if (typeof value === 'object' && value !== null) {
                    widget.successMessage("Uploading file: " + value.name);
                    fileWidget.fileInput("upload", {
                        success: function() {
                            widget.uploadAll(pObj);
                        },
                        error: pObj.error
                    });
                    return true
                }
            }

            // If none need to be uploaded, call success function
            pObj.success();
            return false;
        }
    });

    var TaskWidgetView = IPython.WidgetView.extend({
        render: function () {
            // Double check to make sure that this is the correct cell
            if ($(this.options.cell.element).hasClass("running")) {
                // Render the view.
                this.setElement($('<div></div>'));
                var lsid = this.model.get('lsid');
                var name = this.model.get('name');

                // Determine which identifier is used
                if (lsid) {
                    this.$el.runTask({
                        lsid: lsid
                    });
                }
                else {
                    this.$el.runTask({
                        name: name
                    });
                }

                // Hide the code by default
                var element = this.$el;
                setTimeout(function() {
                    element.closest(".cell").find(".input")
                        .css("height", "0")
                        .css("overflow", "hidden");
                }, 1);
            }
        }
    });

    // Register the TaskWidgetView with the widget manager.
    IPython.WidgetManager.register_widget_view('TaskWidgetView', TaskWidgetView);
});