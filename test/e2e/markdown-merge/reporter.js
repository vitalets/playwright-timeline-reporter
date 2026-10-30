import TimelineReporter from '../../../dist/index.js';

export default class Reporter extends TimelineReporter {
  attempts = 0;

  onTestEnd(test, result) {
    if (++this.attempts === 2 && process.env.CORRUPT_REPORT_ID) {
      result._id = 'unregistered-result';
    }
    super.onTestEnd(test, result);
  }
}
