import { ChartSpan } from '../../../data/tests.js';
import { TitlePath } from './title-path.js';
import { Title } from './title.js';
import { SpanType } from './span-type.js';
import { Location } from './location.js';
import { Badges } from './badges.js';
import { ErrorBlock } from './error-block.js';
import { TestTags } from '../test-tags.js';

export function TestSpanTooltip({ data }: { data: ChartSpan }) {
  return (
    <>
      <SpanType span={data.span} />
      <TitlePath chartSpan={data} />
      <Title chartSpan={data} />
      {data.span.type === 'testBody' && (
        <div style={{ marginBottom: 4 }}>
          <TestTags tags={data.test.tags} maxTags={5} />
        </div>
      )}
      <Location span={data.span} />
      <Badges chartSpan={data} />
      <ErrorBlock span={data.span} />
    </>
  );
}
