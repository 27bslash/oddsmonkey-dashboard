import { readFileSync } from 'node:fs';
import { findAllBetSections } from '../components/logs_reader/core/useLogs';
import { findAllJsonSections } from '../components/logs_reader/core/useJsonLogs';

const jsonLine = (overrides: Record<string, unknown>) =>
  JSON.stringify({
    timestamp: '2026-09-06 19:35:04,123',
    levelname: 'INFO',
    filename: 'file.py',
    funcName: 'fn',
    lineno: 1,
    event: 'balance.balance_check',
    result: 'balance_checked_successfully',
    ...overrides,
  });

it('should merge adjacent same-id bet sections from a fixture', () => {
  const logs = readFileSync('./test_logs/mergedIds.log', 'utf-8');
  const sections = findAllBetSections(logs);
  const _idMap = sections.map((section) => section[0]._id);
  expect(sections).toHaveLength(1);
  expect(sections[0]).toHaveLength(7);
  expect(_idMap).toEqual(['france_v_spain_under_1.5_goals_incomplete']);
});

it('should not absorb setup lines into an adjacent bet section', () => {
  const logs = [
    'INFO: new bet found Event: Real v Mad bet name: Over 2.5 market type: Total Goals',
    'INFO: bet_place.py->place_bet():119 no bet results found from prep bets',
    'WARNING: link_manager.py->open_links():87 could not find a valid row id',
    'INFO: new bet found Event: Real v Mad bet name: Over 2.5 market type: Total Goals',
    'INFO: bet_place.py->place_bet():119 no bet results found from prep bets',
  ].join('\n');
  const sections = findAllBetSections(logs);
  expect(sections.map((g) => g[0]._id)).toEqual([
    'real_v_mad_over_2.5_incomplete',
    'setup',
    'real_v_mad_over_2.5_incomplete__1',
  ]);
});

it('should keep a successful bet as one section despite following setup lines', () => {
  const logs = [
    jsonLine({
      event: 'bet_discovery.new_bet_found',
      result: 'new_bet_found',
      event_name: 'Floresta EC v Maringa',
      bet: 'Floresta EC',
    }),
    jsonLine({}),
    jsonLine({
      event: 'infra.database_operation',
      result: 'bet_logged_to_database',
    }),
    jsonLine({}),
    jsonLine({
      event: 'prep.bet_viability_assessment',
      result: 'preparing_bet_link',
    }),
  ].join('\n');
  const groups = findAllJsonSections(logs);
  const betGroup = groups.filter(
    (group) => group[0].eventName === 'Floresta EC v Maringa',
  );
  expect(betGroup).toHaveLength(1);
  expect(betGroup[0]).toHaveLength(1);
  expect(betGroup[0][0].data[0]).toBe(
    '--- BET SECTION floresta_ec_v_maringa_floresta_ec ---',
  );
  const setupGroups = groups.filter((group) => group[0]._id === 'setup');
  expect(setupGroups).toHaveLength(1);
  expect(setupGroups[0]).toHaveLength(2);
});

it('should fold a restart section into its parent bet section', () => {
  const logs = [
    jsonLine({
      event: 'bet_discovery.new_bet_found',
      result: 'new_bet_found',
      event_name: 'Floresta EC v Maringa',
      bet: 'Floresta EC',
    }),
    jsonLine({}),
    jsonLine({
      event: 'infra.database_operation',
      result: 'bet_logged_to_database',
    }),
    jsonLine({
      event: 'place.bet_status_recheck',
      result: 'restarting_bet_placement',
    }),
    jsonLine({}),
    jsonLine({
      event: 'infra.database_operation',
      result: 'bet_logged_to_database',
    }),
  ].join('\n');
  const groups = findAllJsonSections(logs);
  const betGroups = groups.filter(
    (group) => group[0].eventName === 'Floresta EC v Maringa',
  );
  expect(betGroups).toHaveLength(1);
  expect(betGroups[0].map((section) => section._id)).toEqual([
    'floresta_ec_v_maringa_floresta_ec',
    'floresta_ec_v_maringa_floresta_ec',
  ]);
});