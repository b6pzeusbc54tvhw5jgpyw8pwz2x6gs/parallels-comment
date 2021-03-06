/* global angular,_,marked,hljs,ace */
var corco = angular.module('corco', ['focusOn','ui.ace'] );


ace.define("MyHighlightRules", [], function(require, exports, module) {

	"use strict";

	console.log('in MyHighlightRules');
	var oop = require("ace/lib/oop");
	var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

	var MarkdownHighlightRules = ace.require("ace/mode/markdown_highlight_rules").MarkdownHighlightRules;

	var MyHighlightRules = function() {

	   this.setKeywords = function(kwMap) {     
		   this.keywordRule.onMatch = this.createKeywordMapper(kwMap, "identifier");
	   };

	   this.keywordRule = {
		   regex : "\\w+",
		   onMatch : function() {return "text";}
	   };

	   //session.bgTokenizer.setTokenizer( session.$mode.getTokenizer() );
		 
	   this.$rules = new MarkdownHighlightRules().getRules();
		   
	   this.$rules.start.push( 
			{
				token: "string",
				start: '"', 
				end: '"',
				next: [{ token : "constant.language.escape.lsl", regex : /\\[tn"\\]/}]
			},
			this.keywordRule
	   );
	   //this.addRules( newRules, 'new-' );
	   this.normalizeRules();
	};

	oop.inherits(MyHighlightRules, TextHighlightRules);

	exports.MyHighlightRules = MyHighlightRules;

});


marked.setOptions({
	smartypants: true,
	breaks: true,
	highlight: function(code ) {
		hljs.highlightAuto(code).value;
	}
});

var leftOffsetArray = new Array();
var leftElementArray = new Array();

corco.directive('bindHtmlUnsafe', function( $compile ) {
    return function( $scope, $element, $attrs ) {
        var compile = function( newHTML ) {
        	$element.html(newHTML);

            newHTML = $compile(newHTML)($scope);
        };

        var htmlName = $attrs.bindHtmlUnsafe;

        $scope.$watch(htmlName, function( newHTML ) {
            if(!newHTML) return;
            compile(newHTML);

			if($element[0].className != 'section leftSection') {
				if(leftOffsetArray[$scope.$index] > $element[0].offsetHeight)
					$element.attr( 'style', 'height: ' + leftOffsetArray[$scope.$index] + 'px' );
				else
					leftElementArray[$scope.$index].attr( 'style', 'height: ' + $element[0].offsetHeight + 'px' );
			} else {
				leftOffsetArray.push($element[0].offsetHeight);
				leftElementArray.push($element);
			}
        });
    };
});

// .directive('highlight', [
//     function () {
//         return {
//             replace: false,
//             scope: {
//                 'ngModel': '='
//             },
//             link: function (scope, element) {
//                 // element.html(scope.ngModel);
//                 // var items = element[0].querySelectorAll('code,pre');
//                 // angular.forEach(items, function (item) {
//                 //     hljs.highlightBlock(item);

//             }
//         };
//     }
// ]);

//corco.directive('startEdit', [function() {
	//return {
//
		//link: function( scope, element, attrs ) {
			//element.on('click', 
		//}
//
//}]);

/*
corco.directive('contenteditable', function() {

	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			// view -> model
			elm.bind('blur', function() {
				scope.$apply(function() {
					ctrl.$setViewValue(elm.html());
				});
			});

			// model -> view
			ctrl.$render = function() {
				elm.html(ctrl.$viewValue);
			};

			// load init value from DOM
			ctrl.$setViewValue(elm.html());
		}
	};
});*/

/*
corco.directive('contenteditable', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      // view -> model
      element.bind('blur', function() {
        scope.$apply(function() {
			console.log(element.html());
			ctrl.$setViewValue(element.text());
        });
      });

      // model -> view
      ctrl.$render = function() {
        element.html(ctrl.$viewValue);
      };

      // load init value from DOM
      ctrl.$render();
    }
  };
});
*/

corco.controller('CorcoController', ['$scope','$http','$sce','focus', function( $scope, $http, $sce, focus ) {

	$scope.title = 'Corco project';
	$scope.editingFullRaw = '';
	$scope.raw = '';
	$scope.sectionList = [];
	$scope.noneAnswerCheck = [];
	$scope.docList = [];

	$scope.editingRaw = '';
	$scope.editingHtml = '';

	$scope.editMode = false;
	$scope.fullEditMode = false;

	$scope.editingDirection = false;
	$scope.editingIdx = false;

	var apiHost = 'http://utopos.me:3015';

	$http.post(apiHost + '/readDocList').then( function( res ) {
		$scope.docList = res.data;
	});

	$scope.cancelFullEdit = function() {
		$scope.fullEditMode = '';
		$scope.fullEditMode = false;
	};
	$scope.saveFullEdit = function() {
		var raw = $scope.editingFullRaw;

		var sectionList = $scope.parseToSectionList( raw );

		$scope.makeHtmlByMarkdown( sectionList );

		$scope.sectionList = sectionList;

		$scope.fullEditMode = false;
		$scope.raw = raw;

		var reqParams = {fileName : $scope.selectFileName, raw : $scope.editingFullRaw};
			$http.post(apiHost + '/updateDoc', reqParams).then( function( res ) {
				alert("저장되었습니다.");

				this.readDoc($scope.selectFileName);
		});

		var reqParams = { raw: raw };
		$http.post('doc/test.corco', reqParams ).then( function( res ) {

			console.log( res );

		}.bind(this));
	};

	$scope.editFullRaw = function() {
		$scope.editingFullRaw = $scope.raw;
		$scope.fullEditMode = true;

		/*
		// todo: addMarker
		var session = $scope.fullEditor.session;
		var Range = ace.require('ace/range').Range;
		function init( e ) {

			session.off( "change", init );
			var doc = session.getDocument();
			_.each( doc.getAllLines(), function( line, i ) {
				if( /^corco_answer/.test( line )) {
					session.addMarker(new Range(i, 0, i+1, 0), "foo", "line");
				} else if( /^corco_question/.test( line )) {
					session.addMarker(new Range(i, 0, i+1, 0), "bar", "line");
				}
			});
		}
		session.on("change", init );
		*/
	};

	$scope.aceLoaded = function( _editor ) {

		$scope.fullEditor = _editor;

		//_editor.setWrapBehavioursEnabled( false );
		_editor.setOption("useWrapMode", true);
		_editor.session.setOption("indentedSoftWrap", false);

		var session = _editor.session;

		var Range = ace.require('ace/range').Range;
		var MarkdownMode = ace.require("ace/mode/markdown").Mode;
		var myMode = new MarkdownMode();
		
		myMode.HighlightRules = ace.require("MyHighlightRules").MyHighlightRules;

		session.setMode( myMode );
		myMode.$highlightRules.setKeywords({ "keyword": "corco_answer|corco_question" });
		session.bgTokenizer.start(0);

		/*
		// add marker
		session.on("change", function( e ) {
			
			console.log(e);
			// 그 라인안에서만 놀떄는 그 ㅇ라인만 검사하면되고
			// 라인이 달라지는 경우에 걍 귀찮으니 최소 반복 리밋 주고 한번씩 전수검사하자

			var line, row;
			if( e.start.row === e.end.row ) {

				row = e.start.row;
				line = e.lines[0];
				if( /^corco_answer/.test( line )) {
					session.addMarker(new Range(row, 0, row+1, 0), "foo", "line");
				} else if( /^corco_question/.test( line )) {
					session.addMarker(new Range(row, 0, row+1, 0), "bar", "line");
				}

			} else {

				for( row = e.start.row,i=0; row<e.end.row; row++,i++ ) {

					line = e.lines[i];
					if( /^corco_answer/.test( line )) {
						session.addMarker(new Range(row, 0, row+1, 0), "foo", "line");
					} else if( /^corco_question/.test( line )) {
						session.addMarker(new Range(row, 0, row+1, 0), "bar", "line");
					}
				}
			}
		});
		*/
	};

	$scope.changeEditingRaw = function() {
		$scope.editingHtml = $sce.trustAsHtml( marked( $scope.editingRaw ) );
	};

	$scope.reverseToRaw = function( sectionList ) {

		var raw = '';
		_.each( sectionList, function( section, i ) {
			raw += 'corco_question\n';
			raw += section.leftText+'\n';
			raw += 'corco_answer\n';
			raw += section.rightText;
			
			if( i < sectionList.length-1 ) raw += '\n';
		});
		return raw;
	};


	$scope.saveEdit = function() {
		var modifiedRaw = $scope.editingRaw;
		
		$scope.sectionList[ $scope.editingIdx ][ $scope.editingDirection+'Text'] = modifiedRaw;
		$scope.sectionList[ $scope.editingIdx ][ $scope.editingDirection+'Html'] = $sce.trustAsHtml( marked( modifiedRaw ));

		var raw = $scope.reverseToRaw( $scope.sectionList );

		$scope.editingRaw = '';
		$scope.editMode = false;
	};

	$scope.cancelEdit = function() {
		$scope.editingRaw = '';
		$scope.editMode = false;
	};

	$scope.edit = function( $event, direction, idx ) {

		console.log( 'click edit');
		var raw = this.sectionList[ idx ][ direction+'Text' ];
		$scope.editingDirection = direction;
		$scope.editingIdx = idx;
		$scope.editingRaw = raw;
		$scope.editMode = true;
		$scope.editingHtml = $sce.trustAsHtml( marked( raw ) );

		focus('editArea');
		console.log( $event );
	};

	$scope.parseToSectionList = function( raw ) {

		var lineList = raw.split('\n');
		var sectionList = [];
		var leftText = '', rightText = '';

		var save = function() {
			console.log( leftText );
			sectionList.push({ leftText: leftText, rightText: rightText });
			leftText = '', rightText = '';
			return;
		};

		var leftMatcher = /^corco_question/;
		var rightMatcher = /^corco_answer/;

		var inLeft = false, inRight = false;

		console.log( lineList );
		_.each( lineList, function( line, i ) {

			if (inLeft) {

				if (line.match( leftMatcher )) {
					save();
				} else if (line.match( rightMatcher )) {
					inLeft = false, inRight = true;
				} else {
					leftText += line;
					if( typeof lineList[i+1] === 'string' && ! lineList[i+1].match( rightMatcher ) && ! lineList[i+1].match(leftMatcher) ) {
						leftText += '\n';
					}
				}

			} else if(inRight) {

				if (line.match( rightMatcher )) {
					save();
				} else if (line.match( leftMatcher )) {
					inLeft = true, inRight = false;
					save();
				} else {
					rightText += line;
					if( typeof lineList[i+1] === 'string' && ! lineList[i+1].match( rightMatcher ) && ! lineList[i+1].match(leftMatcher) ) {
						rightText += '\n';
					}
				}
			} else {

				if (line.match( leftMatcher )) {
					inLeft = true;
					if( leftText ) save();
				} else if (line.match( rightMatcher )) {
					inRight = true;
				} else {
					leftText += line;
					if( typeof lineList[i+1] === 'string' && ! lineList[i+1].match( rightMatcher ) && ! lineList[i+1].match(leftMatcher) ) {
						leftText += '\n';
					}
				}
			}
		});
		save();

		return sectionList;
	};

	$scope.makeHtmlByMarkdown = function( sectionList ) {

		_.each( sectionList, function( section ) {
			section.leftHtml = $sce.trustAsHtml( marked(section.leftText) );
			section.rightHtml = $sce.trustAsHtml( marked(section.rightText) );
		});
	};

	$scope.getCorco = function() {

		console.log('click getCorco');
		$http.get('doc/test.corco').then( function( res ) {

			this.raw = res.data.raw;

			var sectionList = this.parseToSectionList( res.data.raw );
			this.makeHtmlByMarkdown( sectionList );
			this.sectionList = sectionList;

		}.bind(this));
	};
	
	$scope.saveCorco = function() {

		var reqParams = { raw: this.raw };
		$http.post('doc/test.corco', reqParams ).then( function( res ) {

			console.log( res.data );

		}.bind(this));
	};

	//show slide mneu
	$scope.showFileList = function() {

	}

	$scope.getSaveDocList = function() {
		var reqParams = { raw: this.raw };
		$http.post(apiHost + '/readDocList').then( function( res ) {
		//$http.post('/readDocList', reqParams ).then( function( res ) {

			$scope.docList = res.data;

			var showFileArea = angular.element( document.querySelector( '#DocListArea' ) );
 
     		for(var i in res.data) {
     			showFileArea.append('</br>'+res.data[i]);
     		}

		});
	};

	$scope.inputFileName = function() {
		var fileName = prompt('파일명을 입력해주세요.', "fileName");

		if(fileName != null) {
			$scope.createDoc( fileName );
		}
	}

	// /createDoc
	$scope.createDoc = function(name) {
		var reqParams = { fileName : name,  raw : 'test' };
		$http.post(apiHost + '/createDoc', reqParams ).then( function( res ) {
			if(res.status == 200) {
				alert('파일 생성 완료');
				this.readDoc(name);

				//docList 갱신
				$http.post(apiHost + '/readDocList').then( function( res ) {
					$scope.docList = res.data;
				});
			}
			else
				alert('파일 생성 실패');
		}.bind(this));
	};

	//single read
	$scope.readDoc = function(name) {
		var reqParams = {fileName : name};
		$http.post(apiHost + '/readDoc', reqParams).then( function( res ) {

			leftOffsetArray = new Array();
			leftElementArray = new Array();

			var raw = res.data.raw;
			$scope.editingFullRaw = raw;

			//file empty check
			if(raw.length < 1)
				$scope.fileEmpty = true;
			else
				$scope.fileEmpty = false;

			//filename save
			$scope.selectFileName = name;

			var sectionList = $scope.parseToSectionList( raw );
			$scope.makeHtmlByMarkdown( sectionList );
			$scope.sectionList = sectionList;
			$scope.sectionCount = raw.length;
			$scope.raw = raw;

			menuClose();

		}.bind(this));
	};

	$scope.updateDoc = function(name) {
		var reqParams = {fileName : name, raw : $scope.editingFullRaw};
		console.log($scope.editingFullRaw);
		// console.log($scope.)

		// $http.post(apiHost + '/updateDoc', reqParams).then( function( res ) {

		// }.bind(this));
	};

}]);

