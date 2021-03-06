const Emp = require('../models/employeeModel')
const Project = require('../models/projectModel')
const Task = require('../models/projectTaskModel');
const assignedTask = require('../models/assignTaskModel');
const Team = require('../models/projectTeamModel');
const jwt = require('jsonwebtoken');
//all employees---------------------------------------
module.exports.empActive = async(req, res)=>{
    await Emp.find({status: process.env.ACTIVE}).sort('employeeId')
    .then(data => res.send(data))
    .catch(error => console.error(error))
}


//all employees Inactive------------------------------
module.exports.empInactive = async(req, res)=>{
    await Emp.find({status: process.env.INACTIVE}).sort('employeeId')
    .then(data => res.send(data))
    .catch(error => console.error(error))
}

//All developers----------------------------------------
module.exports.empDev = async(req, res)=>{
    await Emp.find({status: process.env.ACTIVE,designation: process.env.DEV}).sort('employeeId')
    .then(data => res.send(data))
    .catch(error => console.error(error))
}

//All Projects----------------------------------------
module.exports.projects = async(req, res) =>{
    await Project.find().sort('projectTitle').populate('managerId','name')
    .then(data => res.send(data))
    .catch(error => console.error(error))
}

//Project Tasks-----------------------------------------------
module.exports.projectTasks = async(req, res)=>{
    await Task.find({projectRef: req.params.projectRef}).sort('priority')
    .then(data => res.send(data))
    .catch(error => console.error(error))
}
//Project Teams-----------------------------------------------
module.exports.projectTeams = async(req, res)=>{
    await Team.find({projectRef: req.params.projectRef}).populate('teamMembers.devRef teamLeader')
    .then(data => res.send(data))
    .catch(error => console.error(error))
}

//assigned projects of pm---------------------------------
module.exports.projectsPM = async(req, res) =>{
    const token = req.header('authorization');
    const decode = jwt.decode(token);
    await Project.find({managerId: decode.id}).sort('projectTitle').populate('managerId')
    .then(data => res.send(data))
    .catch(error => console.error(error))
}

//get assigned projects of TL----------------------------------------------------------------------------
module.exports.projectsTL = async(req, res) =>{
    const token = req.header('authorization');
    const decode = jwt.decode(token);
    await Team.find({teamLeader: decode.id})
    .populate({path : 'projectRef teamMembers.devRef', populate : {path : 'managerId'}})
    .sort('projectTitle')
    .then(data => {res.send(data)})
    .catch(error => console.error(error))
}
//assigned Team Members of TL------------------------------------
module.exports.assignedTeamMem = async(req, res) =>{
    try {
        await Task.find({projectRef: req.params.projectRef},async(er,dt)=>{
            if(er) res.status(400).send({type: 'error', message: er.message});
            else{
                await assignedTask.find({taskRef:{$in: dt}}).populate('devRef')
                .exec((e,d)=>{
                 if(e) res.status(400).send({type: 'error', message: e.message});
                 else{
                    res.status(200).send(d)
                 }
             })
            }
        })
     
 } catch (error) {
     console.error(error);
     res.status(500).send({type: 'error', message: 'Error while connecting to the server!'});
    }
 }

//get team members task unassigned TL -----------------------------------------
module.exports.unassignedTeamMem = async(req, res) =>{
    try {
        await Team.find({projectRef: req.params.projectRef}).populate('teamMembers.devRef').exec(async(e,d)=>{
            if(e) res.status(400).send({type: 'error', message: e.message});
            else{
                var teamMem
                d.forEach(element => {
                    teamMem = element.teamMembers;
                });
                let Unassign = teamMem.filter(member => member.isAssigned===false)
                res.status(200).send(Unassign);
            }
        });
 } catch (error) {
     console.error(error);
     res.status(500).send({type: 'error', message: 'Error while connecting to the server!'});
    }
 }
//get assigned task of Team Members-------------------------------------
module.exports.teamMemTask = async(req, res) =>{
    try {
        await Team.find({projectRef: req.params.projectRef}).exec(async(er,d)=>{
            if(er) res.status(400).send({type: 'error', message: er.message});
            else{
                var teamMem
                d.forEach(element => {
                    teamMem = element.teamMembers;
                });
                var team = teamMem.filter(member => member.isAssigned)

                    await assignedTask.find({},{devRef:"team.devRef"}).populate('taskRef')
                    .exec(async(e,d)=>{
                     if(e) res.status(400).send({type: 'error', message: e.message});
                     else{
                         res.status(200).send(d)
                     }
                 })
                
                
            }
        });
 } catch (error) {
     console.error(error);
     res.status(500).send({type: 'error', message: 'Error while connecting to the server!'});
    }
 }
//get confirmation of Dev----------------------------------------------
 module.exports.confirmationDev = async(req,res)=>{
    const token = req.header('authorization');
    try {
        const decode = jwt.decode(token);
        const isManager = await Project.find({managerId: decode.id});
        const isTL = await Team.find({teamLeader: decode.id});
        if(isManager.length>0 && isTL.length>0) return res.status(200).send({isManager:true, isTL:true});
        if(isManager.length>0 && isTL.length===0) return res.status(200).send({isManager:true, isTL:false});
        if(isManager.length===0 && isTL.length>0) return res.status(200).send({isManager:false, isTL:true});
        if(isTL.length===0 && isManager.length===0) return res.status(200).send({isManager:false, isTL:false});
    } catch (error) {
        console.log(error);
        res.status(400).send({type:'error', message:`can't connect to the server`});
    }
}
 //get assigned Projects of Dev----------------------------------------- 
 module.exports.projectsDev = async(req,res)=>{
    const token = req.header('authorization');
    try {
        const decode = jwt.decode(token);
        await Team.find({"teamMembers.devRef": decode.id})
        .populate({path : 'projectRef teamLeader teamMembers.devRef', populate : {path : 'managerId'}})
        .exec((er,dt)=>{
            if(er) return res.status(400).send({type:'error', message:er.message});
            if(dt.length>0) return res.send(dt)
            if(dt.length===0) return res.send({message: 'No Projects assigned'});
        });
       
    } catch (error) {
        console.log(error);
        res.status(400).send({type:'error', message:`can't connect to the server`});
    }
}

//View assigned Project Tasks of Dev---------------------------------------------------------
module.exports.tasksDev = async(req,res)=>{
    const token = req.header('authorization');
    try {
        const decode = jwt.decode(token);
        await assignedTask.find({devRef: decode.id})
        .populate({path : 'taskRef ', populate : {path : 'projectRef'}})
        .exec(async(e,d)=>{
            if(e) return res.status(401).send({type: 'error', message: e.message})
            if(d.length>0) return res.send(d)
            if(d.length===0) return res.send({message: 'No Tasks assigned'});
        });  
    } catch (error) {
        console.log(error);
        res.status(400).send({type:'error', message:`can't connect to the server`});
    }
}
