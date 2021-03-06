const assignTask = require('../../models/assignTaskModel');
const Team = require('../../models/projectTeamModel');

module.exports = async(req, res) =>{
    try {
        const {devRef, taskRef} = req.body;
        let teammembers;
        await assignTask.create({devRef,taskRef},
            async (err, data)=>{
                if(err){
                    if( 'keyPattern' in err ) {
                        let msg = "Task already assigned to the developer"
                        res.status(400).send({type: 'error', message: msg})
                    }
                    else {
                        res.status(400).send({tyep: 'error', message: err.message})
                    }
                }
                else{
                    const team = await Team.findOne({teamMembers:{$elemMatch:{devRef : req.body.devRef}}})
                    .exec(async(e,d)=>{
                        if(e) res.status(400).send({tyep: 'error', message: e.message})
                        else{
                            teammembers = d.teamMembers
                            teammembers = teammembers.map(dev=>({
                                devRef: dev.devRef,
                                _id: dev._id,
                                isAssigned: dev.devRef.toString() == req.body.devRef ? true : dev.isAssigned
                            }))
                            await Team.findByIdAndUpdate(d._id,{$set: {teamMembers: teammembers}},{new:true, upsert:true},async(er,dt)=>{
                                if(er) res.send({type:'error',message:er.message})
                                else res.status(200).send({type:'success', message:'Task assigned'})
                            })
                        }
                    })
                }
            })
    } catch (error) {
        console.error(error);
        res.status(500).send({type: 'error', message: 'Error while connecting to the server!'});
    }
  
}