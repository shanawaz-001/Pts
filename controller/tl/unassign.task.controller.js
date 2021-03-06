const assignTask = require('../../models/assignTaskModel');
const Team = require('../../models/projectTeamModel');

module.exports = async(req, res) =>{
    try {
        const {taskRef} = req.body;
        await assignTask.findOneAndDelete({taskRef: taskRef},
            async (err, data)=>{
                if(err) return res.status(400).send({type:'error', message: err.message});
                else{
                    const team = await Team.findOne({teamMembers:{$elemMatch:{devRef : req.body.devRef}}})
                    .exec(async(e,d)=>{
                        if(e) res.status(400).send({tyep: 'error', message: e.message})
                        else{
                            let teammembers = d.teamMembers
                            teammembers = teammembers.map(dev=>({
                                devRef: dev.devRef,
                                _id: dev._id,
                                isAssigned: dev.devRef.toString() == req.body.devRef ? false : dev.isAssigned
                            }))
                            await Team.findByIdAndUpdate(d._id,{$set: {teamMembers: teammembers}},{new:true, upsert:true},async(er,dt)=>{
                                if(er) res.send({type:'error',message:er.message})
                                else res.status(200).send({type:'success', message:'Task unassigned'})
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


 //  team =  await Team.find({projectRef: req.body.projectRef}).populate('teamMembers','name');
    //  if(!team) res.status(500).send({type: 'warn', message: 'No Tasks'});
    //  else{
    //      var teamMem
    //     team.forEach(element => {
    //         teamMem = element.teamMembers;
    //     });
    // }
