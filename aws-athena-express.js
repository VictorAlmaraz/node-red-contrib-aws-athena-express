/**
 * Copyright 2020 Daniel Terra.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

const { AthenaExpress } = require("athena-express");
const AWS = require("aws-sdk");


module.exports = function(RED) {
    function AwsAthenaNode(config) {
        function sendError(err, node, done, msg) {
            // node.warn(err.message);
    
            if (err) {
                if (done) {
                    // Node-RED 1.0 compatible
                    done(err);
                } else {
                    // Node-RED 0.x compatible
                    node.error(err, msg);
                }
            }
        }

        RED.nodes.createNode(this,config);
        const node = this;
        node.on('input', function(msg, send, done) {
            if(!this.credentials) {
                sendError(new Error("You must configure the node key and secret before using it"),node,done, msg);
                return;
            }
            const aws_access_key_id = this.credentials.aws_access_key_id;
            const aws_secret_access_key = this.credentials.aws_secret_access_key;
            const region = this.credentials.region;

            
            AWS.config.update({
                accessKeyId: aws_access_key_id,
                secretAccessKey: aws_secret_access_key,
                region: region
            });
            
            if (!AWS) {
                sendError(new Error("You must configure the node key and secret before using..."),node,done, msg);
                node.warn("Missing AWS credentials");
                return;
            }

            if (!msg.payload || typeof msg.payload != 'string') {
                sendError(new Error("Did you forget to send the payload? It must be a well-formatted RFC-2822 MIME "),node,done, msg);
                return;
            }

            this.status({fill:"blue",shape:"dot",text:"running query..."});
            

            const params = {
                SourceArn: config.fromArn, 
                RawMessage: {
                    Data: Buffer.from(msg.payload)
                }
            };

            send = send || function() { node.send.apply(node,arguments) }
            
            var athena = new AthenaExpress({aws: AWS, db: msg.db, s3: msg.s3});
            athena.query(msg.payload).then((result) => {
                msg.payload = result;
                this.status({});
                send(msg);
                if(done)
                    done();
            }).catch((err) => {
                    this.status({fill:"red",shape:"dot",text: "error"});
                    sendError(`AWS Athena Error: ${err}`,node,done, msg);
            });
            
        });
    }
    RED.nodes.registerType("AWS Athena Query",AwsAthenaNode, {
        credentials: {
            aws_access_key_id: {type:"text"},
            aws_secret_access_key: {type:"password"},
            region: {type:"text"}
        }
    });
}