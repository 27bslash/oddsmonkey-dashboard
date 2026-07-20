import { readFileSync } from 'node:fs';
import { findAllBetSections } from '../components/logs_reader/core/useLogs';

it('should render', () => {
  const logs = readFileSync('./test_logs/mergedIds.log', 'utf-8');
  const sections = findAllBetSections(logs);
  const _idMap = sections.map((section) => section[0]._id);
  expect(sections.length).toEqual(4);
});
