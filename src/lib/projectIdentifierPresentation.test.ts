import assert from 'node:assert/strict';
import test from 'node:test';
import { estimateDbValueForDisplay, projectNoForDisplay } from './projectIdentifierPresentation';

test('only official project numbers are presented as project codes', () => {
  assert.equal(projectNoForDisplay('2026001'), '2026001');
  assert.equal(projectNoForDisplay('ER-202607-001'), null);
  assert.equal(projectNoForDisplay('project-estimate-request-songpa'), null);
  assert.equal(projectNoForDisplay('3e4edbb2-961d-4212-8387-446655440000'), null);
});

test('estimate database hides internal request and relation identifiers', () => {
  assert.equal(estimateDbValueForDisplay('접수번호', 'ER-202607-001'), '등록됨');
  assert.equal(estimateDbValueForDisplay('프로젝트 연결', 'project-estimate-request-songpa'), '연결됨');
  assert.equal(estimateDbValueForDisplay('PJ NO', 'ER-202607-001'), '발급 대기');
  assert.equal(estimateDbValueForDisplay('PJ NO', '2026001'), '2026001');
  assert.equal(estimateDbValueForDisplay('프로젝트명', '송파 복합시설'), '송파 복합시설');
});
