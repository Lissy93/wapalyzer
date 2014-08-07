import re
import unittest
import wappalyzer


class FakeUrlopenResponse(object):
    def __init__(self, url, html, headers):
        self.url = url
        self.html = html
        self.headers = headers

    def read(self):
        return self.html

    def info(self):
        _cls = self

        class _Info:
            @property
            def dict(self):
                return _cls.headers

        return _Info()


class WappalyzerCustomTestCase(unittest.TestCase):
    def setUp(self):
        self.wappalyzer = wappalyzer.Wappalyzer({'categories':[],'apps':[]})

    def get_wappalyzer(self, categories, apps):
        return wappalyzer.Wappalyzer({'categories': categories, 'apps': apps})

    def test_parse_simple(self):
        parsed = self.wappalyzer.parse_patterns('control/userimage\\.html')
        self.assertEqual(1, len(parsed))
        self.assertTrue(hasattr(parsed[0].regex, 'search'))

    def test_parse_confidence_version(self):
        parsed = self.wappalyzer.parse_patterns('control/userimage\\.html\\;version:1\\;confidence:80')
        self.assertEqual(1, len(parsed))
        self.assertEqual('1', getattr(parsed[0], 'version'))
        self.assertEqual(80, getattr(parsed[0], 'confidence'))

    def _construct_response(self, url=None, headers=None, html=None):
        return FakeUrlopenResponse(
            url=url or '',
            headers=headers or {},
            html=html or ''
        )

    def test_by_url(self):
        wappalyzer = self.get_wappalyzer(
            {},
            {'test1': {'url': 'mysite\d.com'}, 'test2': {'url': 'hissite\d.com'},
             'test3': {'url': ['my', 'his']}})
        resp = self._construct_response(url='http://mysite2.com')

        result = wappalyzer.analyze(response=resp)

        self.assertIn('test1', result)
        self.assertIn('test3', result)

    def test_by_html_with_confidence(self):
        wappalyzer = self.get_wappalyzer(
            {},
            {'test1': {'html': 'body\d\\;confidence:70'}, 'test2': {'html': 'body\w'}})
        resp = self._construct_response(html='body123')

        result = wappalyzer.analyze(response=resp)

        self.assertIn('test1', result)
        self.assertEqual(70, result['test1'].get_confidence())

    def test_by_headers(self):
        wappalyzer = self.get_wappalyzer({},
            {
                'test1': {
                    "headers": {"Server": "debut\\/?([\\d\\.]+)?\\;version:\\1"},
                }
            })
        resp = self._construct_response(headers={"Server": 'debut'})
        result = wappalyzer.analyze(response=resp)
        self.assertIn('test1', result)

        resp = self._construct_response(headers={"Server": 'debut/12'})
        result = wappalyzer.analyze(response=resp)
        self.assertIn('test1', result)

    def test_by_meta(self):
        wappalyzer = self.get_wappalyzer({},
            {
                'test1': {
                    "meta": {"generator": "uCore PHP Framework"},
                },
                'test2': {
                    "meta": {"generator2": "0"},
                }
            })
        resp = self._construct_response(html="<html><meta name='generator'  content='uCore PHP Framework'>")
        result = wappalyzer.analyze(response=resp)
        self.assertIn('test1', result)
        self.assertNotIn('test2', result)

        resp = self._construct_response(html="<html><meta property='generator'  content='uCore PHP Framework'>")
        result = wappalyzer.analyze(response=resp)
        self.assertIn('test1', result)
        self.assertNotIn('test2', result)

        resp = self._construct_response(html="<html><meta content='uCore PHP Framework' name='generator'>")
        result = wappalyzer.analyze(response=resp)
        self.assertIn('test1', result)
        self.assertNotIn('test2', result)

    def test_by_scripts(self):
        wappalyzer = self.get_wappalyzer(
            {},
            {'jquery': {
            "script": ["jquery(?:\\-|\\.)([\\d.]*\\d)[^/]*\\.js\\;version:\\1",
                       "/([\\d.]+)/jquery(\\.min)?\\.js\\;version:\\1", "jquery.*\\.js"],
            }})
        resp = self._construct_response(
            html='<html><script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"></script>')

        result = wappalyzer.analyze(response=resp)

        self.assertIn('jquery', result)



if __name__ == '__main__':
    unittest.main()
