const Task = require('../../models/projectTaskModel');
const Project = require('../../models/projectModel');
module.exports = async(req, res)=>{
    const status = req.body.status;
    try {
        if(status==='COMPLETED'){
            const project = await Task.findOne({_id: req.body.id}).populate('projectRef');
            const tasks = await Task.find({projectRef : project.projectRef}).countDocuments();
            const task = await Task.find({projectRef : project.projectRef}).select('status');
            var completed = task.map(item => item.status=='COMPLETED').length;
            await Project.findByIdAndUpdate(project.projectRef,
                {isCompleted: tasks===completed })
            console.log(task)
            await Task.findByIdAndUpdate(req.body.id,
                {$set: req.body,last_update: Date.now(),doc: Date.now()},
                {runValidators:true,upsert:true,new:true},async(er,dt)=>{
                if(er) return res.status(400).send({type:'error',message: er.message});
                return res.status(200).send({type:'success',message:'Task updated'});
            })
        }
        else{
            Task.findByIdAndUpdate(req.body.id,
                {$set: req.body,last_update: Date.now(),doc:''},
                {runValidators:true,upsert:true,new:true},async(er,dt)=>{
                if(er) return res.status(400).send({type:'error',message: er.message});
                return res.status(200).send({type:'success',message:'Task updated'});
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({type: 'error', message: 'Error while connecting to the server!'});
    }
}
