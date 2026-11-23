"""Regression checks for Apiary.PH's client-side email draft contact form."""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ContactEmailDraftTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.js = (ROOT / "assets/js/script.js").read_text(encoding="utf-8")

    def test_form_explains_that_messages_are_not_automatically_sent(self):
        self.assertIn("Nothing is sent until you review and send the draft there.", self.html)
        self.assertIn('Open Email Draft 🐝</button>', self.html)
        self.assertNotIn("we'll get back to you as soon as possible", self.html)

    def test_hint_is_connected_to_form_for_assistive_technology(self):
        self.assertRegex(self.html, r'<form[^>]+id="contactForm"[^>]+aria-describedby="contact-email-hint"')
        self.assertRegex(self.html, r'<p[^>]+id="contact-email-hint"[^>]*>[^<]*press Send in your email app')

    def test_existing_input_fields_remain_named_and_labeled(self):
        for field_id, field_name in (("cf-name", "name"), ("cf-email", "email"),
                                     ("cf-phone", "phone"), ("cf-address", "address"),
                                     ("cf-note", "note")):
            with self.subTest(field=field_name):
                self.assertIn(f'for="{field_id}"', self.html)
                self.assertRegex(self.html, fr'id="{field_id}"[^>]*name="{field_name}"')

    def test_handler_remains_client_side_mailto_with_no_form_submission(self):
        self.assertIn("e.preventDefault()", self.js)
        self.assertIn("const draftUrl = 'mailto:heraldbebis@gmail.com?subject='", self.js)
        self.assertIn("window.location.href = draftUrl;", self.js)
        self.assertNotIn("fetch(", self.js)
        self.assertIn("encodeURIComponent(", self.js)

    def test_oversized_draft_cannot_silently_truncate_user_message(self):
        self.assertIn('id="contact-draft-status" role="status" aria-live="polite" hidden', self.html)
        self.assertIn("if (draftUrl.length > 1800)", self.js)
        self.assertIn("status.hidden = false;", self.js)
        self.assertIn("f.elements.namedItem('note').focus();", self.js)
        self.assertIn("Your form entries are preserved.", self.js)
        self.assertNotIn("f.reset()", self.js)


    def test_product_descriptions_avoid_unsupported_disease_treatment_claims(self):
        self.assertIn("Honey, whether pure or adulterated, contains sugars", self.html)
        self.assertIn("does not make honey sugar-free or a treatment for diabetes.", self.html)
        self.assertIn("Evidence for treating human diseases is limited", self.html)
        self.assertIn("may trigger allergic reactions", self.html)
        self.assertIn("propolis is not a substitute for established medical treatment.", self.html)
        self.assertNotIn("swapping refined sugar for pure raw honey can bring enormous health benefits", self.html)
        self.assertNotIn("Used for asthma, hay fever, liver disease", self.html)
        self.assertNotIn("Propolis and its extracts help treat various conditions", self.html)



    def test_reduced_motion_overrides_post_load_smooth_scrolling(self):
        css = (ROOT / "assets/css/style.css").read_text(encoding="utf-8")
        self.assertRegex(css, r"@media \(prefers-reduced-motion: reduce\)\s*\{\s*html, html\.smooth\s*\{\s*scroll-behavior: auto;")


if __name__ == "__main__":
    unittest.main()
