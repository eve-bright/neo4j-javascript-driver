/**
 * Copyright (c) 2002-2016 "Neo Technology,"
 * Network Engine for Objects in Lund AB [http://neotechnology.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var neo4j = require("../../lib/v1");

describe('driver', function() {

  it('should expose sessions', function() {
    // Given
    var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "neo4j"));

    // When
    var session = driver.session();

    // Then
    expect( session ).not.toBeNull();
    driver.close();
  });

  it('should handle connection errors', function(done) {
    // Given
    var driver = neo4j.driver("bolt://localhoste", neo4j.auth.basic("neo4j", "neo4j"));

    // Expect
    driver.onError = function (err) {
      //the error message is different whether in browser or node
      expect(err.message).not.toBeNull();
      done();
    };

    // When
    driver.session();
  });

  it('should fail early on wrong credentials', function(done) {
    // Given
    var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "who would use such a password"));

    // Expect
    driver.onError = function (err) {
      //the error message is different whether in browser or node
      expect(err.fields[0].code).toEqual('Neo.ClientError.Security.Unauthorized');
      done();
    };

    // When
    driver.session();
  });

  it('should indicate success early on correct credentials', function(done) {
    // Given
    var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "neo4j"));

    // Expect
    driver.onCompleted = function (meta) {
      done();
    };

    // When
    driver.session();
  });

  describe('using same driver for multiple sessions', function() {
    var driverGlobal, promiseForBadCypherQuery,  sessionForBadCypherQuery
    beforeEach(function(done) {
      driverGlobal = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "neo4j"));
      sessionForBadCypherQuery = driverGlobal.session();
      promiseForBadCypherQuery = sessionForBadCypherQuery.run('call sdaddasds');
      promiseForBadCypherQuery
        .then(function () {})
        .catch(function (r) {
          sessionForBadCypherQuery.close();
          done();
        });
    });

    it('should be able to run subsequent successful query in a new session after failed cypher query', function(done) {
      // Given
      var sessionForGoodCypherQuery = driverGlobal.session();
      var promiseForGoodCypherQuery = sessionForGoodCypherQuery.run('match (n) return n');
      promiseForGoodCypherQuery
        .then(function (r) {
          expect(1).toBe(1);
          done();}
        ).catch(function (e) {done.fail('Expected second query to be successful but got error: "' + e + '"');});
    })
  });
});
