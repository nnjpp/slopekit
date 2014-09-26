module.exports = function(grunt) {

  "use strict";

  var fs = require('fs');
  var pkginfo = grunt.file.readJSON("package.json");

  grunt.initConfig({
    pkg: pkginfo,

    meta: {
      banner: "/*! <%= pkg.title %> <%= pkg.version %> | <%= pkg.homepage %> | (c) 2014 YOOtheme | MIT License */"
    },

    jshint: {
      src: {
        options: {
          jshintrc: "src/.jshintrc"
        },
        src: ["src/js/*.js"]
      }
    },

    less: (function() {
      var lessconf = {
        "docsmin": {
          options: {
            paths: ["docs/less"],
            cleancss: true
          },
          files: {
            "docs/css/uikit.docs.min.css": ["docs/less/uikit.less"]
          }
        }
      };

      var themes = [];

      //themes
      ["default", "custom"].forEach(function(f) {
        if (grunt.option('quick') && f == "custom") return;

        if (fs.existsSync('themes/' + f)) {
          fs.readdirSync('themes/' + f).forEach(function(t) {
            var themepath = 'themes/' + f + '/' + t;
            var distpath = f == "default" ? "dist/css" : themepath + "/dist";

            // Is it a directory?
            if (fs.lstatSync(themepath).isDirectory() && t !== "blank" && t !== '.git') {
              var files = {};

              if (t == "default") {
                files[distpath + "/uikit.css"] = [themepath + "/uikit.less"];
              } else {
                files[distpath + "/uikit." + t + ".css"] = [themepath + "/uikit.less"];
              }

              lessconf[t] = {
                "options": {
                  paths: [themepath]
                },
                "files": files
              };

              var filesmin = {};

              if (t == "default") {
                filesmin[distpath + "/uikit.min.css"] = [themepath + "/uikit.less"];
              } else {
                filesmin[distpath + "/uikit." + t + ".min.css"] = [themepath + "/uikit.less"];
              }

              lessconf[t + "min"] = {
                "options": {
                  paths: [themepath],
                  cleancss: true
                },
                "files": filesmin
              };

              themes.push({
                "path": themepath,
                "name": t,
                "dir": f
              });
            }
          });
        }
      });

      //addons
      themes.forEach(function(theme) {
        if (fs.existsSync(theme.path + '/uikit-addons.less')) {
          var name = (theme.dir == 'default' && theme.name == 'default') ?
                'uikit.addons' : 'uikit.' + theme.name + '.addons';
          var dest = (theme.dir == 'default') ? 'dist/css/addons' : theme.path + '/dist/addons';

          lessconf["addons-" + theme.name] = {
            options: {
              paths: ['src/less/addons']
            },
            files: {}
          };
          lessconf["addons-" + theme.name].files[dest + "/" + name + ".css"] = [theme.path + '/uikit-addons.less'];

          lessconf["addons-min-" + theme.name] = {
            options: {
              paths: ['src/less/addons'],
              cleancss: true
            },
            files: {}
          };
          lessconf["addons-min-" + theme.name].files[dest + "/" + name + ".min.css"] = [theme.path + '/uikit-addons.less'];
        }
      });

      return lessconf;
    })(),

    copy: {
      fonts: {
        files: [{
          expand: true,
          cwd: "src/fonts",
          src: ["*"],
          dest: "dist/fonts/"
        }]
      }
    },

    concat: {
      dist: {
        options: {
          separator: "\n\n"
        },
        src: [
          "src/js/core.js",
          "src/js/component.js",
          "src/js/utility.js",
          "src/js/touch.js",
          "src/js/alert.js",
          "src/js/button.js",
          "src/js/dropdown.js",
          "src/js/grid.js",
          "src/js/modal.js",
          "src/js/offcanvas.js",
          "src/js/nav.js",
          "src/js/tooltip.js",
          "src/js/switcher.js",
          "src/js/tab.js",
          "src/js/scrollspy.js",
          "src/js/smooth-scroll.js",
          "src/js/toggle.js",
        ],
        dest: "dist/js/uikit.js"
      }
    },

    usebanner: {
      dist: {
        options: {
          position: 'top',
          banner: "<%= meta.banner %>\n"
        },
        files: {
          src: ['dist/css/**/*.css', 'dist/js/**/*.js']
        }
      }
    },

    uglify: {
      distmin: {
        options: {
          //banner: "<%= meta.banner %>\n"
        },
        files: {
          "dist/js/uikit.min.js": ["dist/js/uikit.js"]
        }
      },
      addonsmin: {
        files: (function() {

          var files = {};

          fs.readdirSync('src/js/addons').forEach(function(f) {

            if (f.match(/\.js/)) {

              var addon = f.replace(".js", "");

              grunt.file.copy('src/js/addons/' + f, 'dist/js/addons/' + addon + '.js');

              files['dist/js/addons/' + addon + '.min.js'] = ['src/js/addons/' + f];

            }
          });

          return files;
        })()
      }
    },

    compress: {
      dist: {
        options: {
          archive: ("dist/uikit-" + pkginfo.version + ".zip")
        },
        files: [{
          expand: true,
          cwd: "dist/",
          src: ["css/**/*", "js/**/*", "fonts/*"],
          dest: ""
        }]
      }
    },

    watch: {
      grunt: {
        options: {
          reload: true
        },
        files: ['Gruntfile.js']
      },
      src: {
        files: ["src/**/*.less", "themes/**/*.less", "src/js/*.js"],
        tasks: ["build"]
      }
    }

  });

  grunt.registerTask('indexthemes', 'Rebuilding theme index.', function() {

    var themes = [];

    ["default", "custom"].forEach(function(f) {

      if (fs.existsSync('themes/' + f)) {

        fs.readdirSync('themes/' + f).forEach(function(t) {

          var themepath = 'themes/' + f + '/' + t;

          // Is it a directory?
          if (fs.lstatSync(themepath).isDirectory() && t !== "blank" && t !== '.git') {

            var theme = {
              "name": t.split("-").join(" ").replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function($1) {
                return $1.toUpperCase();
              }),
              "url": "../" + themepath + "/uikit.less",
              "config": (fs.existsSync(themepath + "/customizer.json") ? "../" + themepath + "/customizer.json" : "../themes/default/uikit/customizer.json"),
              "styles": {}
            };

            if (fs.existsSync(themepath + '/styles')) {

              var styles = {};

              fs.readdirSync(themepath + '/styles').forEach(function(sf) {

                var stylepath = [themepath, 'styles', sf, 'style.less'].join('/');

                if (fs.existsSync(stylepath)) {

              theme.styles = styles;
            }

            themes.push(theme);
          }
        });
      }
    });

    grunt.log.writeln(themes.length + ' themes found: ' + themes.map(function(theme) {
      return theme.name;
    }).join(", "));

    fs.writeFileSync("themes/themes.json", JSON.stringify(themes, " ", 4));
  });

  // Load grunt tasks from NPM packages
  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-compress");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-banner");

  // Register grunt tasks
  grunt.registerTask("build", ["jshint", "indexthemes", "less", "concat", "copy", "uglify", "usebanner"]);
  grunt.registerTask("default", ["build", "compress"]);
};
