/* global it */
/* global describe */

var logLevel = 'error'
const should = require('should')
const sia = require('search-index-adder')
const sim = require('../')

describe('Matching epub: ', function () {

  var indexer
  var matcher

  it('should initialize the first search index', function (done) {
    sia({
      indexPath: 'test/sandbox/si-epub-matching-test',
      logLevel: logLevel
    },
      function (err, thisIndexer) {
        should.not.exist(err)
        indexer = thisIndexer
        done()
      })
  })


  it('should index test data into the index', function (done) {
    var data = [
      {
        id: 'doc101',
        title: 'Accessible EPUB 3',
        body: 'EPUB is great. epubxhighestsort',
        spineItemPath: 'epub_content/accessible_epub_3/EPUB/ch03s06.xhtml'
      },
      {
        id: 'doc102',
        title: 'Even More Accessible EPUBulation 3',
        body: 'EPUB is epubtastic, epubxhighestsort',
        spineItemPath: 'epub_content/accessible_epub_3/EPUB/ch03s07.xhtml'
      },
      {
        id: 'doc103',
        title: 'EPUB 3 FTW',
        body: 'EPUB is fantabulous, epubxhighestsort',
        spineItemPath: 'epub_content/accessible_epub_3/EPUB/ch03s08.xhtml'
      },
      {
        id: 'doc104',
        title: '中文的标题',
        body: '中文的字符',
        spineItemPath: 'epub_content/accessible_epub_3/EPUB/ch03s09.xhtml'
      },
      {
        id: 'doc105',
        title: 'another doc',
        body: 'make epubxhighestsort the most common TF term',
        spineItemPath: 'epub_content/accessible_epub_4/EPUB/ch03s09.xhtml'
      }
    ]
    indexer.add(
      data,
      {
        batchName: 'epubdata',
        fieldOptions: [{
          fieldName: 'id',
          searchable: false
        }, {
          fieldName: 'spineItemPath',
          searchable: false
        }]
      }, function (err) {
        (err === null).should.be.exactly(true)
        indexer.close(function(err) {
          should.not.exist(err)
          done()
        })
      })
  })

  it('should initialize the matcher', function (done) {
    sim({
      indexPath: 'test/sandbox/si-epub-matching-test',
      logLevel: logLevel
    },
      function (err, thisMatcher) {
        should.not.exist(err)
        matcher = thisMatcher
        done()
      })
  })


  it('should match on given field and get results, id not searchable', function (done) {
    matcher.match({
      beginsWith: 'epub',
      field: 'body'
    }, function (err, matches) {
      should.exist(matches)
      ;(err === null).should.be.exactly(true)
      matches.should.eql(
        [ 'epubxhighestsort',
          'epub',
          'epubtastic'
        ])
      done()
    })
  })

  it('should match on all fields and get results, id not searchable', function (done) {
    matcher.match({
      beginsWith: 'epub'
    }, function (err, matches) {
      should.exist(matches)
      ;(err === null).should.be.exactly(true)
      matches.should.eql(
        [ 'epubxhighestsort',
          'epub',
          'epubtastic',
          'epubulation' ])
      done()
    })
  })

  it('should match on all fields and return IDs', function (done) {
    var str = 'epub'
    matcher.match({beginsWith: str, type: 'ID'}, function (err, matches) {
      should.exist(matches)
      ;(err === null).should.be.exactly(true)
      matches.should.eql(
        [ [ 'epubxhighestsort', [ 'doc101', 'doc102', 'doc103', 'doc105' ] ],
          [ 'epub', [ 'doc101', 'doc102', 'doc103' ] ],
          [ 'epubtastic', [ 'doc102' ] ],
          [ 'epubulation', [ 'doc102' ] ] ]
      )
      done()
    })
  })

  it('should match on all fields and return IDs and counts', function (done) {
    var str = 'epub'
    matcher.match({beginsWith: str, type: 'count'}, function (err, matches) {
      should.exist(matches)
      ;(err === null).should.be.exactly(true)
      matches.should.eql(
        [ [ 'epubxhighestsort', 4 ],
          [ 'epub', 3 ],
          [ 'epubtastic', 1 ],
          [ 'epubulation', 1 ] ]
      )
      done()
    })
  })

  it('should match on all fields and get results, and set limit', function (done) {
    var str = 'epub'
    matcher.match({beginsWith: str, limit: 1}, function (err, matches) {
      should.exist(matches)
      ;(err === null).should.be.exactly(true)
      matches.length.should.be.exactly(1)
      matches[0].should.be.exactly('epubxhighestsort')
      done()
    })
  })

  it('should match on body field and get results', function (done) {
    var str = 'epub'
    matcher.match({beginsWith: str, field: 'body'}, function (err, matches) {
      should.exist(matches)
      ;(err === null).should.be.exactly(true)
      matches.length.should.be.exactly(3)
      matches[0].should.be.exactly('epubxhighestsort')
      matches[1].should.be.exactly('epub')
      matches[2].should.be.exactly('epubtastic')
      done()
    })
  })

  it('should match on title field and get results', function (done) {
    var str = 'epub'
    matcher.match({beginsWith: str, field: 'title'}, function (err, matches) {
      should.exist(matches)
      ;(err === null).should.be.exactly(true)
      matches.length.should.be.exactly(2)
      matches[0].should.be.exactly('epub')
      matches[1].should.be.exactly('epubulation')
      done()
    })
  })

  it('should work for Unicode', function (done) {
    var str = '中文的'
    matcher.match({beginsWith: str}, function (err, matches) {
      should.exist(matches)
      ;(err === null).should.be.exactly(true)
      matches.length.should.be.exactly(2)
      matches.should.containEql('中文的标题')
      matches.should.containEql('中文的字符')
      done()
    })
  })

  it('handles match strings that are empty', function (done) {
    var str = ''
    matcher.match({beginsWith: str}, function (err, matches) {
      should.exist(matches)
      matches.length.should.be.exactly(0)
      ;(err instanceof Error).should.be.exactly(true)
      err.toString().should.be.exactly('Error: match string can not be empty')
      done()
    })
  })

  it('handles malformed options object', function (done) {
    var str = 'this string should be an object'
    matcher.match(str, function (err, matches) {
      should.exist(matches)
      matches.length.should.be.exactly(0)
      ;(err instanceof Error).should.be.exactly(true)
      err.toString().should.be.exactly('Error: Options should be an object')
      done()
    })
  })

  it('Throws error if below threshold', function (done) {
    var str = 'ep'
    matcher.match({beginsWith: str}, function (err, matches) {
      should.exist(matches)
      matches.length.should.be.exactly(0)
      ;(err instanceof Error).should.be.exactly(true)
      err.toString().should.be.exactly('Error: match string must be longer than threshold (3)')
      done()
    })
  })

  it('Can reduce threshold', function (done) {
    var str = 'ep'
    matcher.match({beginsWith: str, threshold: 1}, function (err, matches) {
      should.exist(matches)
      ;(err instanceof Error).should.be.exactly(false)
      matches.should.eql(
        [ 'epubxhighestsort',
          'epub',
          'epubtastic',
          'epubulation' ])
      done()
    })
  })
})
