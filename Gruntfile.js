module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['Gruntfile.js', 'build/2048.js'],
      options: {
        node: true,
        globals: {
          jQuery: false,
          React: false,
          alert: false,
          document: false,
		  "_": false,
		  "$": false
        }
      }
    },
    '6to5': {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          'build/2048.js': 'src/2048.es6.js'
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'build/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('codelint', ['jshint', 'uglify']);
  grunt.registerTask('default', ['6to5', 'jshint', 'uglify']);
};
